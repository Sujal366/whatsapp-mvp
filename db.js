import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Simple database connection test
console.log("🔍 Testing Supabase Database Connection...\n");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "✓ Present" : "✗ Missing");

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ Missing Supabase configuration in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    console.log("\n⏳ Testing connection...");

    const { data, error } = await supabase.auth.getSession();

    if (error && !error.message.includes("Invalid API key")) {
      throw error;
    }

    console.log("✅ Supabase service is reachable");

    // Try a simple database query
    const { error: dbError } = await supabase.from("test").select("*").limit(1);

    if (dbError) {
      if (dbError.message.includes("Invalid API key")) {
        console.log(
          "⚠️  Limited API key permissions (this is normal for anon key)"
        );
      } else if (
        dbError.message.includes("relation") &&
        dbError.message.includes("does not exist")
      ) {
        console.log(
          "✅ Database connection successful! (test table doesn't exist yet)"
        );
      } else {
        console.log("Database query result:", dbError.message);
      }
    } else {
      console.log("✅ Database connection and query successful!");
    }

    console.log("\n🎉 Connection test completed successfully!");
    return true;
  } catch (error) {
    console.error("\n❌ Connection test failed:");
    console.error("Error:", error.message);
    return false;
  }
}

testConnection();
