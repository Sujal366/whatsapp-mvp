import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

console.log("🏗️  Setting up database schema...\n");

async function setupSchema() {
  try {
    // 1. Create users table (if it doesn't exist)
    console.log("1️⃣ Creating users table...");
    const { error: usersError } = await supabase.rpc("execute_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (usersError && !usersError.message.includes("already exists")) {
      console.log("Note: Users table creation:", usersError.message);
    } else {
      console.log("✅ Users table ready");
    }

    // 2. Create products table
    console.log("\n2️⃣ Creating products table...");
    const { error: productsError } = await supabase.rpc("execute_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (productsError && !productsError.message.includes("already exists")) {
      console.log("Note: Products table creation:", productsError.message);
    } else {
      console.log("✅ Products table ready");
    }

    // 3. Create orders table
    console.log("\n3️⃣ Creating orders table...");
    const { error: ordersError } = await supabase.rpc("execute_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          total_amount DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (ordersError && !ordersError.message.includes("already exists")) {
      console.log("Note: Orders table creation:", ordersError.message);
    } else {
      console.log("✅ Orders table ready");
    }

    // 4. Create order_items table
    console.log("\n4️⃣ Creating order_items table...");
    const { error: orderItemsError } = await supabase.rpc("execute_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id),
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (
      orderItemsError &&
      !orderItemsError.message.includes("already exists")
    ) {
      console.log("Note: Order items table creation:", orderItemsError.message);
    } else {
      console.log("✅ Order items table ready");
    }

    // 5. Insert some sample products
    console.log("\n5️⃣ Adding sample products...");
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (!existingProducts || existingProducts.length === 0) {
      const { error: insertError } = await supabase.from("products").insert([
        { name: "Apples", price: 50.0, description: "Fresh red apples per kg" },
        { name: "Milk", price: 25.0, description: "Fresh milk 1 liter" },
        { name: "Bread", price: 30.0, description: "Whole wheat bread loaf" },
        {
          name: "Bananas",
          price: 40.0,
          description: "Fresh bananas per dozen",
        },
        { name: "Rice", price: 80.0, description: "Basmati rice 1 kg" },
      ]);

      if (insertError) {
        console.log("Note: Sample products insertion:", insertError.message);
      } else {
        console.log("✅ Sample products added");
      }
    } else {
      console.log("✅ Products already exist, skipping sample data");
    }

    console.log("\n🎉 Database schema setup completed successfully!");

    // Show current tables
    console.log("\n📋 Current tables:");
    const { data: tables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "users",
        "products",
        "orders",
        "order_items",
        "messages",
      ]);

    if (tables) {
      tables.forEach((table) => console.log(`  - ${table.table_name}`));
    }
  } catch (error) {
    console.error("❌ Schema setup failed:", error.message);
  }
}

setupSchema();
