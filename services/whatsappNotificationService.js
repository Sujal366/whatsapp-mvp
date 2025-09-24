// WhatsApp customer notification service
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

class WhatsAppNotificationService {
  
  // Send text message to customer
  async sendText(to, text) {
    try {
      const url = `https://graph.facebook.com/v16.0/${PHONE_NUMBER_ID}/messages`;
      const body = {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      };
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      console.log(`📱 WhatsApp notification sent to ${to}:`, result);
      return result;
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      throw error;
    }
  }

  // Customer status update templates
  async notifyPhotoCapture(phoneNumber, orderId) {
    const message = `📸 Great news! Your delivery is in progress.

Order #${orderId}
✅ Photo captured by our delivery agent
🚚 Your order is on its way!

You'll get another update once delivery is completed.`;

    return await this.sendText(phoneNumber, message);
  }

  async notifyDeliveryComplete(phoneNumber, orderId, customerName) {
    const message = `✅ Delivery Completed!

Order #${orderId}
✍️ Signature collected from: ${customerName}
📦 Your order has been successfully delivered

Thank you for choosing our service! 🙏`;

    return await this.sendText(phoneNumber, message);
  }

  async notifyKYCComplete(phoneNumber, orderId, customerName) {
    const message = `👤 KYC Verification Complete

Order #${orderId}
✅ Identity verification completed for: ${customerName}
📋 All documentation is now on file

Your order is fully processed. Thank you! 🎉`;

    return await this.sendText(phoneNumber, message);
  }

  async notifyOrderStatusChange(phoneNumber, orderId, oldStatus, newStatus) {
    let message = `📋 Order Status Update\n\nOrder #${orderId}\n`;
    
    switch (newStatus.toLowerCase()) {
      case 'in_progress':
        message += `🚀 Status: In Progress
📸 Our agent has started processing your delivery
⏱️ Expected completion within 2-4 hours`;
        break;
        
      case 'delivered':
        message += `✅ Status: Delivered
📦 Your order has been delivered
✍️ Signature collected for confirmation`;
        break;
        
      case 'completed':
        message += `🎉 Status: Completed
✅ All processing complete
📋 Documentation finalized
Thank you for your business!`;
        break;
        
      default:
        message += `Status changed from ${oldStatus} → ${newStatus}`;
    }
    
    return await this.sendText(phoneNumber, message);
  }

  // Generic notification for custom messages
  async notifyCustomer(phoneNumber, message) {
    return await this.sendText(phoneNumber, message);
  }
}

export default new WhatsAppNotificationService();