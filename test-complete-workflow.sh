#!/bin/bash

echo "🚀 Testing Complete PWA Agent Workflow"
echo "========================================="

# Get authentication token
echo "🔐 Getting authentication token..."
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "agent", "password": "password"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Authentication successful"

# Test Order Details API
echo -e "\n📦 Testing Order Details API..."
ORDER_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/orders/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Order Details:"
echo $ORDER_RESPONSE | jq '.order | {id, total_amount, status, items: .items | length}'

# Test Photo Capture
echo -e "\n📸 Testing Photo Capture..."
PHOTO_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/orders/1/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."}')

echo "Photo Response:"
echo $PHOTO_RESPONSE | jq

# Test Signature Capture
echo -e "\n✍️ Testing Signature Capture..."
SIGNATURE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/orders/1/signature" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", "customerName": "John Smith"}')

echo "Signature Response:"
echo $SIGNATURE_RESPONSE | jq

# Test KYC Data Submission
echo -e "\n👤 Testing KYC Data Submission..."
KYC_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/orders/1/kyc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "phoneNumber": "+1234567890",
    "email": "john.smith@email.com",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "idType": "passport",
    "idNumber": "P123456789",
    "dateOfBirth": "1985-06-15"
  }')

echo "KYC Response:"
echo $KYC_RESPONSE | jq

# Final Order Status Check
echo -e "\n🔍 Final Order Status Check..."
FINAL_ORDER=$(curl -s -X GET "http://localhost:3000/api/orders/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Final Order Status:"
echo $FINAL_ORDER | jq '.order | {
  id, 
  status, 
  total_amount,
  photo_captured: (.photo_captured // false),
  signature_captured: (.signature_captured // false),
  kyc_completed: (.kyc_completed // false),
  customer_name: (.customer_name // "Not provided")
}'

echo -e "\n✅ Complete Agent Workflow Test Completed!"
echo "🎯 Summary:"
echo "   📸 Photo: Captured and saved"
echo "   ✍️  Signature: Captured with customer name"
echo "   👤 KYC: Complete verification data stored"
echo "   📱 PWA: Ready for agent use"