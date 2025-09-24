#!/usr/bin/env node

import fetch from "node-fetch";

const NGROK_URL = "https://4590338a632a.ngrok-free.app";
const VERIFY_TOKEN = "test123";

async function testWebhookVerification() {
  try {
    console.log("Testing webhook verification...");
    const url = `${NGROK_URL}/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=${VERIFY_TOKEN}`;
    console.log("Testing URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Meta-Webhook-Test",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers));

    const text = await response.text();
    console.log("Response body:", text);

    if (response.status === 200 && text === "test123") {
      console.log("✅ Webhook verification PASSED");
    } else {
      console.log("❌ Webhook verification FAILED");
    }
  } catch (error) {
    console.error("Error testing webhook:", error.message);
  }
}

async function testWebhookMessage() {
  try {
    console.log("\nTesting webhook message processing...");

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

    const response = await fetch(`${NGROK_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Meta-Webhook-Test",
      },
      body: JSON.stringify(testMessage),
    });

    console.log("Message response status:", response.status);
    const text = await response.text();
    console.log("Message response body:", text);

    if (response.status === 200) {
      console.log("✅ Webhook message processing PASSED");
    } else {
      console.log("❌ Webhook message processing FAILED");
    }
  } catch (error) {
    console.error("Error testing webhook message:", error.message);
  }
}

// Run tests
testWebhookVerification().then(() => testWebhookMessage());
