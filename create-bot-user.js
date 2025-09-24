import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function createBotUser() {
  console.log("👤 Creating WhatsApp bot user...\n");

  // Check if bot user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", "whatsapp@bot.local")
    .single();

  if (existingUser) {
    console.log("✅ Bot user already exists:", existingUser);
    return;
  }

  // Create bot user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert([
      {
        name: "WhatsApp Bot User",
        email: "whatsapp@bot.local",
        password_hash: "bot_placeholder_hash", // Placeholder since bot doesn't login normally
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to create bot user:", error.message);
  } else {
    console.log("✅ Bot user created successfully:", newUser);
  }
}

createBotUser();
