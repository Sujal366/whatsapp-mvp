import { createClient } from "redis";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class RedisSessionService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackSessions = {}; // In-memory fallback if Redis fails

    // Redis configuration from environment
    this.redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.sessionExpiry = 30 * 60; // 30 minutes in seconds

    this.initialize();
  }

  async initialize() {
    try {
      console.log("🔄 Connecting to Redis...");

      this.client = createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 10000,
          lazyConnect: true,
        },
      });

      // Redis event handlers
      this.client.on("connect", () => {
        console.log("📡 Redis client connected");
      });

      this.client.on("ready", () => {
        console.log("✅ Redis client ready");
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        console.error("❌ Redis client error:", err.message);
        this.isConnected = false;
      });

      this.client.on("end", () => {
        console.log("📴 Redis client disconnected");
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.error("💥 Failed to connect to Redis:", error.message);
      console.log("⚠️ Using in-memory session fallback");
      this.isConnected = false;
    }
  }

  /**
   * Get user session
   */
  async getSession(userId) {
    try {
      if (this.isConnected && this.client) {
        const sessionData = await this.client.get(`session:${userId}`);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
        return null;
      } else {
        // Fallback to in-memory
        return this.fallbackSessions[userId] || null;
      }
    } catch (error) {
      console.error("❌ Error getting session:", error.message);
      // Fallback to in-memory
      return this.fallbackSessions[userId] || null;
    }
  }

  /**
   * Set user session with expiration
   */
  async setSession(userId, sessionData) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(
          `session:${userId}`,
          this.sessionExpiry,
          JSON.stringify(sessionData)
        );
        console.log(`📝 Session saved for user ${userId} (Redis)`);
      } else {
        // Fallback to in-memory
        this.fallbackSessions[userId] = sessionData;
        console.log(`📝 Session saved for user ${userId} (In-memory fallback)`);

        // Auto-cleanup in-memory sessions after 30 minutes
        setTimeout(() => {
          delete this.fallbackSessions[userId];
        }, this.sessionExpiry * 1000);
      }
    } catch (error) {
      console.error("❌ Error setting session:", error.message);
      // Fallback to in-memory
      this.fallbackSessions[userId] = sessionData;
    }
  }

  /**
   * Delete user session
   */
  async deleteSession(userId) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(`session:${userId}`);
        console.log(`🗑️ Session deleted for user ${userId} (Redis)`);
      } else {
        // Fallback to in-memory
        delete this.fallbackSessions[userId];
        console.log(
          `🗑️ Session deleted for user ${userId} (In-memory fallback)`
        );
      }
    } catch (error) {
      console.error("❌ Error deleting session:", error.message);
      // Fallback to in-memory
      delete this.fallbackSessions[userId];
    }
  }

  /**
   * Check if user has an active session
   */
  async hasSession(userId) {
    try {
      const session = await this.getSession(userId);
      return session !== null;
    } catch (error) {
      console.error("❌ Error checking session:", error.message);
      return false;
    }
  }

  /**
   * Update session expiry (extend session)
   */
  async extendSession(userId) {
    try {
      if (this.isConnected && this.client) {
        const exists = await this.client.exists(`session:${userId}`);
        if (exists) {
          await this.client.expire(`session:${userId}`, this.sessionExpiry);
          console.log(`⏰ Session extended for user ${userId}`);
        }
      }
      // For in-memory fallback, sessions auto-cleanup, so no action needed
    } catch (error) {
      console.error("❌ Error extending session:", error.message);
    }
  }

  /**
   * Get all active sessions (for debugging)
   */
  async getActiveSessions() {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys("session:*");
        return keys.map((key) => key.replace("session:", ""));
      } else {
        return Object.keys(this.fallbackSessions);
      }
    } catch (error) {
      console.error("❌ Error getting active sessions:", error.message);
      return [];
    }
  }

  /**
   * Clean up expired sessions (manual cleanup for in-memory fallback)
   */
  cleanupExpiredSessions() {
    if (!this.isConnected) {
      // Only cleanup in-memory sessions, Redis handles expiry automatically
      console.log("🧹 Cleaning up expired in-memory sessions");
      // In-memory sessions are already cleaned up by setTimeout
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      activeSessionsCount: Object.keys(this.fallbackSessions).length,
      redisUrl: this.redisUrl,
    };
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        console.log("👋 Redis client disconnected gracefully");
      }
    } catch (error) {
      console.error("❌ Error disconnecting Redis:", error.message);
    }
  }
}

// Export singleton instance
export default new RedisSessionService();
