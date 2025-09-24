import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

console.log("🔍 Testing database schema...\n");

async function testSchema() {
  // Test products table
  console.log("1️⃣ Testing products table...");
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*");

  if (productsError) {
    console.log("❌ Products table error:", productsError.message);
  } else {
    console.log("✅ Products table exists");
    console.log("Products count:", products?.length || 0);
    if (products && products.length > 0) {
      console.log(
        "Sample products:",
        products.slice(0, 3).map((p) => `${p.name} - ₹${p.price}`)
      );
    }
  }

  // Test orders table
  console.log("\n2️⃣ Testing orders table...");
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .limit(1);

  if (ordersError) {
    console.log("❌ Orders table error:", ordersError.message);
  } else {
    console.log("✅ Orders table exists");
    console.log("Orders count:", orders?.length || 0);
  }

  // Test users table
  console.log("\n3️⃣ Testing users table...");
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, email")
    .limit(1);

  if (usersError) {
    console.log("❌ Users table error:", usersError.message);
  } else {
    console.log("✅ Users table exists");
    console.log("Users count:", users?.length || 0);
  }
}

testSchema().catch(console.error);
