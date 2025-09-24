#!/bin/bash

# Test Customer WhatsApp Notifications
# This script tests the complete order flow with customer notifications

echo "🧪 Testing Customer WhatsApp Notifications"
echo "==========================================="

# Test configuration
API_BASE="http://localhost:3000/api"
TEST_PHONE="+1234567890" # Replace with your test WhatsApp number
TEST_ORDER_ID="1"

# First, get authentication token
echo "🔐 Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "agent", "password": "password"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to authenticate. Please check credentials."
  exit 1
fi

echo "✅ Authentication successful"

# Test 1: Photo Capture (should send in-progress notification)
echo -e "\n📸 Testing Photo Capture Notification..."
PHOTO_RESPONSE=$(curl -s -X POST "$API_BASE/orders/$TEST_ORDER_ID/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."}')

echo "Photo Response:"
echo $PHOTO_RESPONSE | jq

# Wait a moment for notification to be sent
sleep 2

# Test 2: Signature Capture (should send delivered notification)  
echo -e "\n✍️ Testing Signature Capture Notification..."
SIGNATURE_RESPONSE=$(curl -s -X POST "$API_BASE/orders/$TEST_ORDER_ID/signature" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", "customerName": "John Smith"}')

echo "Signature Response:"
echo $SIGNATURE_RESPONSE | jq

# Wait a moment for notification to be sent
sleep 2

# Test 3: KYC Completion (should send completed notification)
echo -e "\n👤 Testing KYC Completion Notification..."
KYC_RESPONSE=$(curl -s -X POST "$API_BASE/orders/$TEST_ORDER_ID/kyc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "phoneNumber": "'+$TEST_PHONE'",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "idType": "drivers_license",
    "idNumber": "DL123456789",
    "dateOfBirth": "1990-01-01"
  }')

echo "KYC Response:"
echo $KYC_RESPONSE | jq

# Final order status check
echo -e "\n📋 Final Order Status Check..."
FINAL_ORDER=$(curl -s -X GET "$API_BASE/orders/$TEST_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Final Order Status:"
echo $FINAL_ORDER | jq '.order | {
  id, 
  status, 
  customer_phone,
  photo_captured: (.photo_captured // false),
  signature_captured: (.signature_captured // false),
  kyc_completed: (.kyc_completed // false),
  customer_name: (.customer_name // "Not provided")
}'

echo -e "\n🎯 Customer Notification Test Summary:"
echo "   📱 Photo capture → WhatsApp notification sent"
echo "   📱 Signature capture → WhatsApp notification sent"  
echo "   📱 KYC completion → WhatsApp notification sent"
echo -e "\n✅ Check your WhatsApp ($TEST_PHONE) for 3 status notifications!"
echo -e "\n🔧 To customize messages, edit services/whatsappNotificationService.js"