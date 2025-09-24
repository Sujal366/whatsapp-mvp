import "dotenv/config";
import fetch from "node-fetch";

console.log("🧪 Testing Order API...\n");

async function testOrderAPI() {
  try {
    // Test creating an order via API
    const orderData = {
      items: [
        { name: "apples", quantity: 2 },
        { name: "milk", quantity: 1 },
      ],
    };

    console.log("📤 Sending order request:");
    console.log(JSON.stringify(orderData, null, 2));

    const response = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    console.log("\n📥 Response:", response.status);
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n✅ Order API test successful!");
    } else {
      console.log("\n❌ Order API test failed!");
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testOrderAPI();
