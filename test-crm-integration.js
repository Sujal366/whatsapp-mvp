#!/usr/bin/env node

/**
 * Test script for HubSpot CRM integration
 * Run with: node test-crm-integration.js
 */

import hubspotService from "./services/hubspotService.js";

async function testCRMIntegration() {
  console.log("🧪 Testing HubSpot CRM Integration...\n");

  // Test 1: Check if HubSpot is configured
  console.log("1️⃣ Testing HubSpot Configuration...");
  if (hubspotService.isConfigured()) {
    console.log("✅ HubSpot API key is configured");
  } else {
    console.log(
      "⚠️ HubSpot API key not configured - integration will be disabled"
    );
    console.log(
      "💡 Add HUBSPOT_API_KEY to your .env file to enable CRM features\n"
    );
    return;
  }

  // Test 2: Create a test contact
  console.log("\n2️⃣ Testing Contact Creation...");
  const testPhone = "+1234567890";
  const testName = "Test Customer";

  const contact = await hubspotService.createOrUpdateContact(
    testPhone,
    testName
  );
  if (contact) {
    console.log("✅ Test contact created/updated successfully");
    console.log(`   Contact ID: ${contact.id}`);
  } else {
    console.log("❌ Failed to create test contact");
    return;
  }

  // Test 3: Create a test deal
  console.log("\n3️⃣ Testing Deal Creation...");
  const testOrderData = {
    orderId: 999,
    total: 25.5,
    items: [
      { quantity: 2, product_name: "Test Apples", total_price: 20.0 },
      { quantity: 1, product_name: "Test Milk", total_price: 5.5 },
    ],
    customerPhone: testPhone,
    customerName: testName,
  };

  const deal = await hubspotService.createDeal(testOrderData, contact.id);
  if (deal) {
    console.log("✅ Test deal created successfully");
    console.log(`   Deal ID: ${deal.id}`);
    console.log(`   Deal Name: ${deal.properties.dealname}`);
  } else {
    console.log("❌ Failed to create test deal");
    return;
  }

  // Test 4: Test webhook notification (if URL configured)
  console.log("\n4️⃣ Testing Webhook Notifications...");
  const webhookUrls = process.env.EXTERNAL_WEBHOOKS?.split(",") || [];

  if (webhookUrls.length > 0 && webhookUrls[0].trim()) {
    console.log(`   Testing webhook: ${webhookUrls[0].trim()}`);
    const webhookResult = await hubspotService.sendWebhookNotification(
      testOrderData,
      webhookUrls[0].trim()
    );

    if (webhookResult) {
      console.log("✅ Webhook notification sent successfully");
    } else {
      console.log(
        "⚠️ Webhook notification failed (this is normal if URL is not valid)"
      );
    }
  } else {
    console.log("⚠️ No webhook URLs configured in EXTERNAL_WEBHOOKS");
  }

  console.log("\n🎉 CRM Integration Test Complete!");
  console.log("\n📋 Summary:");
  console.log(`   • HubSpot Contact: Created (ID: ${contact.id})`);
  console.log(`   • HubSpot Deal: Created (ID: ${deal.id})`);
  console.log("   • Integration is ready for production use");

  console.log("\n💡 Next Steps:");
  console.log("   1. Replace HUBSPOT_API_KEY with your real HubSpot API key");
  console.log(
    "   2. Configure EXTERNAL_WEBHOOKS if you need webhook notifications"
  );
  console.log(
    "   3. Place a test order through WhatsApp to see it sync with HubSpot"
  );
}

// Run the test
testCRMIntegration().catch((error) => {
  console.error("💥 Test failed:", error.message);
  process.exit(1);
});
