import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🔍 Testing database table access...\n");

async function testDatabase() {
  // Test 1: Check if messages table exists and is accessible
  console.log("1️⃣ Testing messages table access...");
  const { data: tableData, error: tableError } = await supabase
    .from("messages")
    .select("*")
    .limit(1);

  if (tableError) {
    console.log("❌ Table access error:", tableError.message);

    if (
      tableError.message.includes("relation") &&
      tableError.message.includes("does not exist")
    ) {
      console.log(
        "💡 The 'messages' table doesn't exist yet. You need to create it!"
      );
      console.log("\nTo create the table:");
      console.log("1. Go to your Supabase dashboard");
      console.log("2. Go to the SQL Editor");
      console.log("3. Run this SQL command:");
      console.log(`
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_number TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else if (tableError.message.includes("Invalid API key")) {
      console.log("💡 API key doesn't have sufficient permissions");
      console.log(
        "You might need to use the service_role key instead of anon key"
      );
    }
  } else {
    console.log("✅ Messages table exists and is accessible");
    console.log("Current records:", tableData?.length || 0);
  }

  // Test 2: Try to insert a test message
  console.log("\n2️⃣ Testing message insertion...");
  const { data: insertData, error: insertError } = await supabase
    .from("messages")
    .insert([{ user_name: "test_user", message: "Test message from script" }]);

  if (insertError) {
    console.log("❌ Insert error:", insertError.message);
  } else {
    console.log("✅ Test insert successful");
    console.log("Inserted data:", insertData);
  }
}

testDatabase().catch(console.error);
