import supabase from "./supabaseClient.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addAgentActionColumns() {
  try {
    console.log("🔧 Adding agent action columns to orders table...");

    // Since we can't use DDL via Supabase RPC, let's manually add the columns using SQL
    console.log(
      "📝 Please run the following SQL commands in your Supabase SQL Editor:"
    );

    const sqlCommands = `
-- Add agent action tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS photo_captured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_captured_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS signature_captured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signature_captured_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS kyc_data JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Update existing orders to have updated_at
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;
`;

    console.log(sqlCommands);
    console.log(
      "\n✅ Please copy and run the above SQL commands in Supabase SQL Editor"
    );
    console.log(
      "🔗 Go to: https://supabase.com/dashboard/project/dbsccrvvlfzggexaggms/sql"
    );

    // Test if columns exist by trying to select them
    const { data, error } = await supabase
      .from("orders")
      .select("id, photo_captured, signature_captured, kyc_completed")
      .limit(1);

    if (!error) {
      console.log("✅ Columns already exist! Schema is ready.");
    } else {
      console.log(
        "⚠️ Columns need to be added. Please run the SQL commands above."
      );
    }
  } catch (error) {
    console.error("❌ Error checking schema:", error);
  }
}

addAgentActionColumns();
