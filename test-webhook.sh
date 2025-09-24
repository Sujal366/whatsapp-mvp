curl -X POST https://9465eb22fe33.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "your-waba-id",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "853746611144626"
          },
          "messages": [{
            "from": "1234567890",
            "id": "wamid.test123",
            "timestamp": "1696346892",
            "text": {
              "body": "hello"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'