#!/usr/bin/env node

import "dotenv/config";
import supabase from "./supabaseClient.js";

async function updateOrdersForAgentAssignment() {
  console.log("🔄 Updating orders system for agent assignment...\n");

  try {
    // Method 1: Try to add agent_id column via direct SQL
    console.log("1️⃣ Attempting to add agent_id column...");

    const { error: alterError } = await supabase
      .from("orders")
      .update({}) // This will fail but let us see the current structure
      .eq("id", 0); // Non-existent id

    // Method 2: Check current orders and assign them to demo agent
    console.log("2️⃣ Checking current unassigned orders...");

    const { data: orders, error: selectError } = await supabase
      .from("orders")
      .select("*")
      .is("agent_id", null); // Check for unassigned orders

    if (selectError && selectError.code === "42703") {
      console.log("⚠️ agent_id column does not exist yet");
      console.log("💡 For now, we'll show all orders to all agents");
    } else if (orders) {
      console.log(
        `📦 Found ${orders.length} orders that need agent assignment`
      );
    }

    // Method 3: Create a sample agent user if needed
    console.log("3️⃣ Ensuring demo agent exists...");

    const { data: agent, error: agentError } = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", "agent_demo")
      .single();

    if (agentError && agentError.code === "PGRST116") {
      // Agent doesn't exist, create one
      const { data: newAgent, error: createError } = await supabase
        .from("users")
        .insert([
          {
            phone_number: "agent_demo",
            name: "Demo Agent",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating demo agent:", createError);
      } else {
        console.log("✅ Created demo agent:", newAgent);
      }
    } else if (agent) {
      console.log("✅ Demo agent already exists:", agent);
    }

    console.log("\n🎯 Current Solution:");
    console.log(
      "- All WhatsApp orders will be visible to all agents in the PWA"
    );
    console.log("- Agents can view and manage any pending order");
    console.log("- In production, you would add proper agent assignment logic");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  process.exit(0);
}

updateOrdersForAgentAssignment();
