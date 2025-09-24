#!/usr/bin/env node

// Simple test to simulate WhatsApp sending a message
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

console.log("Test message payload:");
console.log(JSON.stringify(testMessage, null, 2));
console.log("\nTo test, run:");
console.log(`curl -X POST https://4590338a632a.ngrok-free.app/webhook \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testMessage)}'`);
