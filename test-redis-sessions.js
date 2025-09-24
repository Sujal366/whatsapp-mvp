#!/usr/bin/env node

/**
 * Test script for Redis session management
 * Run with: node test-redis-sessions.js
 */

import dotenv from "dotenv";
dotenv.config();

import sessionService from "./services/redisSessionService.js";

async function testRedisSession() {
  console.log("🧪 Testing Redis Session Management...\n");

  // Wait a moment for Redis to initialize
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 1: Check Redis status
  console.log("1️⃣ Testing Redis Connection...");
  const status = sessionService.getStatus();
  console.log("📊 Redis Status:", status);

  // Test 2: Set a test session
  console.log("\n2️⃣ Testing Session Creation...");
  const testUserId = "1234567890";
  const sessionData = {
    state: "awaiting_order_items",
    timestamp: new Date().toISOString(),
  };

  await sessionService.setSession(testUserId, sessionData);
  console.log("✅ Test session created");

  // Test 3: Get the session back
  console.log("\n3️⃣ Testing Session Retrieval...");
  const retrievedSession = await sessionService.getSession(testUserId);
  console.log("📋 Retrieved session:", retrievedSession);

  if (retrievedSession && retrievedSession.state === "awaiting_order_items") {
    console.log("✅ Session data matches what was stored");
  } else {
    console.log("❌ Session data mismatch");
  }

  // Test 4: Check if session exists
  console.log("\n4️⃣ Testing Session Existence Check...");
  const hasSession = await sessionService.hasSession(testUserId);
  console.log("🔍 Session exists:", hasSession);

  // Test 5: Get all active sessions
  console.log("\n5️⃣ Testing Active Sessions List...");
  const activeSessions = await sessionService.getActiveSessions();
  console.log("📋 Active sessions:", activeSessions);

  // Test 6: Extend session
  console.log("\n6️⃣ Testing Session Extension...");
  await sessionService.extendSession(testUserId);
  console.log("⏰ Session extended");

  // Test 7: Delete session
  console.log("\n7️⃣ Testing Session Deletion...");
  await sessionService.deleteSession(testUserId);
  console.log("🗑️ Test session deleted");

  // Test 8: Verify session is gone
  console.log("\n8️⃣ Testing Session Cleanup...");
  const sessionAfterDelete = await sessionService.getSession(testUserId);
  console.log("🔍 Session after delete:", sessionAfterDelete);

  if (sessionAfterDelete === null) {
    console.log("✅ Session successfully deleted");
  } else {
    console.log("❌ Session still exists after delete");
  }

  console.log("\n🎉 Redis Session Test Complete!");

  // Final status
  const finalStatus = sessionService.getStatus();
  console.log("\n📊 Final Status:", finalStatus);

  // Disconnect
  await sessionService.disconnect();
  process.exit(0);
}

// Run the test
testRedisSession().catch((error) => {
  console.error("💥 Redis test failed:", error.message);
  process.exit(1);
});
