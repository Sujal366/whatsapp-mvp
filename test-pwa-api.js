#!/usr/bin/env node

import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api";

console.log("🧪 Testing PWA API Communication...\n");

async function testAPI() {
  try {
    // Test 1: Check if server is responding
    console.log("1️⃣ Testing server health...");
    const healthResponse = await fetch("http://localhost:3000/");
    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log("✅ Server responding:", healthText);
    } else {
      console.log("❌ Server not responding");
      return;
    }

    // Test 2: Test orders endpoint
    console.log("\n2️⃣ Testing orders API...");
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      console.log("✅ Orders API working, found orders:", orders.length);
      if (orders.length > 0) {
        console.log("Latest order:", {
          id: orders[0].id,
          status: orders[0].status,
          amount: orders[0].total_amount,
        });
      }
    } else {
      console.log("❌ Orders API failed:", ordersResponse.status);
    }

    // Test 3: Test products endpoint
    console.log("\n3️⃣ Testing products API...");
    const productsResponse = await fetch(`${API_BASE}/products`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log("✅ Products API working, found products:", products.length);
    } else {
      console.log("❌ Products API failed:", productsResponse.status);
    }
  } catch (error) {
    console.error("❌ API Test Error:", error.message);
  }
}

testAPI();
