import "dotenv/config";
import fetch from "node-fetch";

class WhatsAppTokenManager {
  constructor() {
    this.currentToken = process.env.WHATSAPP_TOKEN;
    this.appId = process.env.WHATSAPP_APP_ID;
    this.appSecret = process.env.WHATSAPP_APP_SECRET;
    this.tokenExpiryDate = null;

    // Check token validity on startup
    this.initializeTokenInfo();
  }

  async initializeTokenInfo() {
    try {
      const tokenInfo = await this.getTokenInfo();
      if (tokenInfo.expires_at) {
        this.tokenExpiryDate = new Date(tokenInfo.expires_at * 1000);
        console.log(
          `🔑 Token expires at: ${this.tokenExpiryDate.toISOString()}`
        );

        // Schedule renewal reminder
        this.scheduleRenewalReminder();
      } else {
        console.log("🔑 Token appears to be permanent (no expiry)");
      }
    } catch (error) {
      console.error("❌ Failed to get token info:", error.message);
    }
  }

  async getTokenInfo() {
    const response = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${this.currentToken}&access_token=${this.currentToken}`
    );

    if (!response.ok) {
      throw new Error(`Token validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async refreshToken() {
    if (!this.appId || !this.appSecret) {
      console.log(
        "⚠️ App ID or Secret not configured - cannot refresh token automatically"
      );
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${this.currentToken}`
      );

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.access_token) {
        console.log("✅ Token refreshed successfully!");
        console.log("🔧 Update your .env file with new token:");
        console.log(`WHATSAPP_TOKEN=${data.access_token}`);
        return data.access_token;
      }
    } catch (error) {
      console.error("❌ Token refresh failed:", error.message);
      return false;
    }
  }

  scheduleRenewalReminder() {
    if (!this.tokenExpiryDate) return;

    const now = new Date();
    const timeUntilExpiry = this.tokenExpiryDate.getTime() - now.getTime();
    const reminderTime = timeUntilExpiry - 5 * 24 * 60 * 60 * 1000; // 5 days before expiry

    if (reminderTime > 0) {
      setTimeout(() => {
        console.log(
          "🚨 TOKEN RENEWAL REMINDER: WhatsApp token expires in 5 days!"
        );
        console.log("🔧 Run token refresh or generate new long-lived token");
        this.refreshToken();
      }, reminderTime);
    }
  }

  isTokenExpiringSoon(daysThreshold = 7) {
    if (!this.tokenExpiryDate) return false;

    const now = new Date();
    const daysUntilExpiry =
      (this.tokenExpiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

    return daysUntilExpiry <= daysThreshold;
  }

  getTokenStatus() {
    if (!this.tokenExpiryDate) {
      return {
        status: "permanent",
        message: "Token appears to be permanent",
        daysRemaining: null,
      };
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (this.tokenExpiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilExpiry <= 0) {
      return {
        status: "expired",
        message: "Token has expired",
        daysRemaining: 0,
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: "expiring_soon",
        message: `Token expires in ${daysUntilExpiry} days`,
        daysRemaining: daysUntilExpiry,
      };
    } else {
      return {
        status: "active",
        message: `Token expires in ${daysUntilExpiry} days`,
        daysRemaining: daysUntilExpiry,
      };
    }
  }
}

// Export singleton instance
export const tokenManager = new WhatsAppTokenManager();
export default tokenManager;
