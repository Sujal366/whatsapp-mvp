#!/usr/bin/env node

import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api";

console.log("🧪 Testing PWA Complete Flow...\n");

async function testPWAFlow() {
  try {
    // Test 1: Login with demo credentials
    console.log("1️⃣ Testing PWA Login...");
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "agent",
        password: "password",
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log("✅ Login successful!");
      console.log(
        "User:",
        loginData.user.username,
        "Role:",
        loginData.user.role
      );

      const token = loginData.token;

      // Test 2: Access orders with token
      console.log("\n2️⃣ Testing authenticated orders access...");
      const ordersResponse = await fetch(`${API_BASE}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        console.log(
          "✅ Orders access successful! Found orders:",
          orders.length
        );

        if (orders.length > 0) {
          console.log("Latest orders:");
          orders.slice(0, 3).forEach((order, i) => {
            console.log(
              `  ${i + 1}. Order #${order.id} - ₹${order.total_amount} (${
                order.status
              })`
            );
          });
        }
      } else {
        console.log("❌ Orders access failed:", ordersResponse.status);
        console.log("Error:", await ordersResponse.text());
      }

      // Test 3: Products access (should work without auth)
      console.log("\n3️⃣ Testing products access...");
      const productsResponse = await fetch(`${API_BASE}/products`);
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        console.log(
          "✅ Products access successful! Found products:",
          products.length
        );
      } else {
        console.log("❌ Products access failed:", productsResponse.status);
      }
    } else {
      console.log("❌ Login failed:", loginResponse.status);
      console.log("Error:", await loginResponse.text());
    }
  } catch (error) {
    console.error("❌ PWA Test Error:", error.message);
  }
}

testPWAFlow();
