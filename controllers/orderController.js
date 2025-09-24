import supabase from "../supabaseClient.js";
import hubspotService from "../services/hubspotService.js";

const createOrder = async (req, res) => {
  try {
    const { items, customerPhone, customerName } = req.body; // Added customer info for CRM

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    // Calculate total and prepare order items
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      let product;

      // Handle both WhatsApp format (name-based) and API format (product_id-based)
      if (item.name && !item.product_id) {
        // WhatsApp format: find product by name (case-insensitive)
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .ilike("name", `%${item.name.trim()}%`)
          .limit(1);

        if (productError || !productData || productData.length === 0) {
          return res.status(400).json({
            error: `Product '${item.name}' not found. Available products: apples, milk, bread, bananas, rice`,
          });
        }
        product = productData[0];
      } else if (item.product_id) {
        // API format: find product by ID
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

        if (productError || !productData) {
          return res
            .status(400)
            .json({ error: `Product with ID ${item.product_id} not found` });
        }
        product = productData;
      } else {
        return res
          .status(400)
          .json({ error: "Each item must have either 'name' or 'product_id'" });
      }

      const quantity = parseInt(item.quantity) || 1;
      const itemTotal = product.price * quantity;
      total += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: product.price,
        total_price: itemTotal,
      });
    }

    // Create order without user requirement for now (WhatsApp orders)
    let userId = req.user?.id; // If authenticated

    if (!userId) {
      // For WhatsApp orders, use the bot user (id: 2)
      userId = 2; // WhatsApp Bot User
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total_amount: total,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) {
      return res
        .status(500)
        .json({ error: "Failed to create order: " + orderError.message });
    }

    // Insert order items
    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      return res
        .status(500)
        .json({ error: "Failed to create order items: " + itemsError.message });
    }

    // Return success response
    const orderData = {
      orderId: order.id,
      total: total,
      items: orderItems,
      customerPhone: customerPhone,
      customerName: customerName,
      status: order.status,
      createdAt: order.created_at,
    };

    // 🚀 CRM INTEGRATION: Create contact and deal in HubSpot
    try {
      if (customerPhone) {
        console.log("📞 Starting HubSpot integration for order:", order.id);

        // Create or update contact in HubSpot
        const hubspotContact = await hubspotService.createOrUpdateContact(
          customerPhone,
          customerName
        );

        // Create deal in HubSpot
        if (hubspotContact) {
          await hubspotService.createDeal(orderData, hubspotContact.id);
        } else {
          // Create deal without contact association
          await hubspotService.createDeal(orderData);
        }

        // Send webhook notifications to external systems
        const webhookUrls = process.env.EXTERNAL_WEBHOOKS?.split(",") || [];
        for (const webhookUrl of webhookUrls) {
          if (webhookUrl.trim()) {
            await hubspotService.sendWebhookNotification(
              orderData,
              webhookUrl.trim()
            );
          }
        }
      }
    } catch (crmError) {
      // Don't fail the order if CRM integration fails
      console.error(
        "⚠️ CRM integration error (order still created):",
        crmError.message
      );
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      total: total,
      items: orderItems,
      message: `Order placed successfully! Order ID: ${order.id}, Total: ₹${total}`,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

const getOrders = async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export { createOrder, getOrders };
