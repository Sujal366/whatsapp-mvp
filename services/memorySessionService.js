// Simple in-memory session service (FREE alternative to Redis)
// Note: This resets when server restarts, but suitable for MVP

const userSessions = new Map();

const sessionService = {
  async setSession(userId, data) {
    console.log(`📝 Session saved for user ${userId} (Memory)`);
    userSessions.set(userId, data);
    return true;
  },

  async getSession(userId) {
    console.log(`📖 Session retrieved for user ${userId} (Memory)`);
    return userSessions.get(userId) || null;
  },

  async deleteSession(userId) {
    console.log(`🗑️ Session deleted for user ${userId} (Memory)`);
    return userSessions.delete(userId);
  },

  // Get all active sessions (for debugging)
  getAllSessions() {
    return Array.from(userSessions.entries());
  },

  // Clear all sessions
  clearAllSessions() {
    userSessions.clear();
    console.log("🧹 All sessions cleared (Memory)");
  },
};

export default sessionService;
