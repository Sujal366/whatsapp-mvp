import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import { createClient } from "@supabase/supabase-js";
import supabase from "./supabaseClient.js";
import sessionService from "./services/redisSessionService.js";

const app = express();
app.use(cors());
// Increase body size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => res.send("Generic Orders MVP Backend Running"));

// Remove duplicate supabase creation - using imported supabaseClient instead

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

async function saveMessage(user, text) {
  try {
    console.log(`🔄 Attempting to save message from ${user}: "${text}"`);

    const { data, error } = await supabase
      .from("messages")
      .insert([{ user_name: user, message: text }]);

    if (error) {
      console.error("❌ DB Error:", error.message);
      console.error("Error details:", error);
    } else {
      console.log("✅ Message saved to DB successfully");
      console.log("Saved data:", data);
    }
  } catch (err) {
    console.error("❌ Unexpected DB Error:", err);
  }
}

// GET for webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST for incoming messages
app.post("/webhook", async (req, res) => {
  console.log("INCOMING PAYLOAD:", JSON.stringify(req.body, null, 2));
  try {
    const entry = req.body.entry && req.body.entry[0];
    const changes = entry && entry.changes && entry.changes[0];
    const value = changes && changes.value;
    const messages = value && value.messages;
    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const text = message.text && message.text.body?.trim().toLowerCase();

      console.log(`Message from ${from}: ${text}`);

      // Get user session from Redis
      const userSession = await sessionService.getSession(from);

      let reply;
      if (text === "hi" || text === "hello") {
        reply = "👋 Hey there! Welcome to our WhatsApp bot.";
      } else if (text === "help") {
        reply =
          "Here are some commands you can try:\n- 'products' \n- 'order'\n- 'status'\n- 'hi'";
      } else if (text === "order") {
        // Set session state in Redis
        await sessionService.setSession(from, {
          state: "awaiting_order_items",
        });
        reply = "📦 Please send your order items like: 2 apples, 1 milk";
      } else if (userSession?.state === "awaiting_order_items") {
        const orderText = text; // user input, e.g., "2 apples, 1 milk"

        // Parse items
        const items = parseOrderText(orderText); // helper function

        if (items.length === 0) {
          reply =
            "❌ I couldn't understand your order. Please try again with format: '2 apples, 1 milk'";
        } else {
          try {
            // Get customer name from WhatsApp contact info if available
            const customerName =
              value.contacts && value.contacts[0]
                ? value.contacts[0].profile.name
                : null;

            // Call backend API to create order with customer information
            const response = await fetch(`http://localhost:3000/api/orders`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items,
                customerPhone: from,
                customerName: customerName,
              }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
              reply = `✅ Order placed successfully!\n\n📋 Order ID: ${
                data.orderId
              }\n💰 Total: ₹${data.total}\n\n📦 Items:\n${data.items
                .map(
                  (item) =>
                    `• ${item.quantity}x ${item.product_name} - ₹${item.total_price}`
                )
                .join("\n")}`;
            } else {
              reply = `❌ Order failed: ${data.error || "Unknown error"}`;
            }
          } catch (error) {
            console.error("Order API error:", error);
            reply =
              "❌ Sorry, there was an error processing your order. Please try again later.";
          }
        }

        // Clear session after order completion
        await sessionService.deleteSession(from);
      } else if (text === "status") {
        reply =
          "🔎 Checking your order status... (this will connect to DB later)";
      } else if (text === "products") {
        // Fetch products from Supabase
        const { data: products, error } = await supabase
          .from("products")
          .select("name, price");

        if (error) {
          console.error("❌ Error fetching products:", error.message);
          reply = "❌ Sorry, I couldn't fetch the product list right now.";
        } else if (products.length === 0) {
          reply = "ℹ️ No products available at the moment.";
        } else {
          reply =
            "🛒 Available Products:\n" +
            products.map((p) => `• ${p.name} - ₹${p.price}`).join("\n");
        }
      } else {
        reply = `I didn't understand "${text}". Type 'help' to see options.`;
      }

      await sendText(from, reply);
    } else {
      console.log("No messages array found (could be a status webhook).");
    }
  } catch (err) {
    console.error("Error handling webhook:", err);
  }
  // respond 200 quickly so Meta doesn't retry
  res.sendStatus(200);
});

async function sendText(to, text) {
  const url = `https://graph.facebook.com/v16.0/${PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    text: { body: text },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  console.log("Send API response:", j);
}

function parseOrderText(text) {
  const items = text.split(",").map((item) => item.trim());
  const result = [];
  items.forEach((i) => {
    const [quantity, ...nameParts] = i.split(" ");
    const name = nameParts.join(" ");
    const qty = parseInt(quantity);
    if (name && qty > 0) result.push({ name, quantity: qty });
  });
  return result;
}

const port = process.env.PORT || 3000;

// Add error handling for the server
const server = app.listen(port, () => {
  console.log(`Webhook server listening on http://localhost:${port}`);
  console.log("Server is running and ready to receive requests...");
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Keep the process alive
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");

  // Disconnect Redis
  await sessionService.disconnect();

  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
