#!/usr/bin/env node

import fetch from "node-fetch";

const NGROK_URL = "https://9465eb22fe33.ngrok-free.app";

// Simulate exactly what WhatsApp sends
const testMessage = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "your-waba-id",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15551234567",
              phone_number_id: "853746611144626",
            },
            messages: [
              {
                from: "1234567890",
                id: "wamid.test123",
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: "hello",
                },
                type: "text",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

async function testWebhook() {
  try {
    console.log("🧪 Testing webhook with simulated WhatsApp message...");
    console.log("📨 Sending to:", `${NGROK_URL}/webhook`);

    const response = await fetch(`${NGROK_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "WhatsApp/2.21.0",
      },
      body: JSON.stringify(testMessage),
    });

    console.log("📊 Response status:", response.status);
    const responseText = await response.text();
    console.log("📝 Response body:", responseText);

    if (response.status === 200) {
      console.log("✅ Webhook is working! Your server code is correct.");
      console.log(
        "❌ The issue is that Meta is not sending requests to your webhook."
      );
    } else {
      console.log("❌ Webhook has issues. Check your server code.");
    }
  } catch (error) {
    console.error("💥 Error testing webhook:", error.message);
  }
}

testWebhook();
