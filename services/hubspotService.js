import fetch from "node-fetch";

class HubSpotService {
  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY;
    this.baseUrl = "https://api.hubapi.com";

    if (!this.apiKey) {
      console.warn(
        "⚠️  HubSpot API key not configured. CRM features will be disabled."
      );
    }
  }

  /**
   * Check if HubSpot is properly configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Create or update a contact in HubSpot
   */
  async createOrUpdateContact(phoneNumber, name = null) {
    if (!this.isConfigured()) {
      console.log("🔕 HubSpot not configured, skipping contact creation");
      return null;
    }

    try {
      console.log(`📞 Creating/updating HubSpot contact for ${phoneNumber}`);

      const contactData = {
        properties: {
          phone: phoneNumber,
          hs_whatsapp_phone_number: phoneNumber,
          lifecyclestage: "lead",
          lead_source: "WhatsApp Bot",
        },
      };

      // Add name if provided
      if (name) {
        contactData.properties.firstname = name;
      }

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ HubSpot contact created/updated: ${result.id}`);
        return result;
      } else if (response.status === 409) {
        // Contact already exists, try to find it
        console.log("📋 Contact already exists, fetching existing contact");
        return await this.findContactByPhone(phoneNumber);
      } else {
        console.error("❌ HubSpot contact creation failed:", result);
        return null;
      }
    } catch (error) {
      console.error("💥 HubSpot contact creation error:", error.message);
      return null;
    }
  }

  /**
   * Find a contact by phone number
   */
  async findContactByPhone(phoneNumber) {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "phone",
                    operator: "EQ",
                    value: phoneNumber,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.results && result.results.length > 0) {
        console.log(
          `📋 Found existing HubSpot contact: ${result.results[0].id}`
        );
        return result.results[0];
      }

      return null;
    } catch (error) {
      console.error("💥 HubSpot contact search error:", error.message);
      return null;
    }
  }

  /**
   * Create a deal in HubSpot
   */
  async createDeal(orderData, contactId = null) {
    if (!this.isConfigured()) {
      console.log("🔕 HubSpot not configured, skipping deal creation");
      return null;
    }

    try {
      console.log(`💼 Creating HubSpot deal for order ${orderData.orderId}`);

      const dealData = {
        properties: {
          dealname: `WhatsApp Order #${orderData.orderId}`,
          amount: orderData.total,
          dealstage: "qualifiedtoprospect", // Default HubSpot stage
          pipeline: "default", // Default HubSpot pipeline
          source: "WhatsApp Bot",
          description: `Order items: ${orderData.items
            .map((item) => `${item.quantity}x ${item.product_name}`)
            .join(", ")}`,
          custom_order_id: orderData.orderId.toString(),
          whatsapp_phone_number: orderData.customerPhone,
        },
      };

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ HubSpot deal created: ${result.id}`);

        // Associate deal with contact if contactId is provided
        if (contactId) {
          await this.associateDealWithContact(result.id, contactId);
        }

        return result;
      } else {
        console.error("❌ HubSpot deal creation failed:", result);
        return null;
      }
    } catch (error) {
      console.error("💥 HubSpot deal creation error:", error.message);
      return null;
    }
  }

  /**
   * Associate a deal with a contact
   */
  async associateDealWithContact(dealId, contactId) {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 3, // Deal to Contact association
            },
          ]),
        }
      );

      if (response.ok) {
        console.log(`🔗 Associated deal ${dealId} with contact ${contactId}`);
        return true;
      } else {
        const result = await response.json();
        console.error("❌ Deal-Contact association failed:", result);
        return false;
      }
    } catch (error) {
      console.error("💥 Deal-Contact association error:", error.message);
      return false;
    }
  }

  /**
   * Update deal stage (when order status changes)
   */
  async updateDealStage(dealId, stage) {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals/${dealId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              dealstage: stage,
            },
          }),
        }
      );

      if (response.ok) {
        console.log(`📈 Updated deal ${dealId} stage to ${stage}`);
        return true;
      } else {
        const result = await response.json();
        console.error("❌ Deal stage update failed:", result);
        return false;
      }
    } catch (error) {
      console.error("💥 Deal stage update error:", error.message);
      return false;
    }
  }

  /**
   * Send order data to external webhooks
   */
  async sendWebhookNotification(orderData, webhookUrl) {
    if (!webhookUrl) return null;

    try {
      console.log(`📡 Sending webhook notification to ${webhookUrl}`);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WhatsApp-Bot-Webhook/1.0",
        },
        body: JSON.stringify({
          event: "order.created",
          timestamp: new Date().toISOString(),
          data: orderData,
        }),
      });

      if (response.ok) {
        console.log("✅ Webhook notification sent successfully");
        return true;
      } else {
        console.error(`❌ Webhook notification failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("💥 Webhook notification error:", error.message);
      return false;
    }
  }
}

export default new HubSpotService();
