import crypto from "crypto";
import { tokenStore } from "../config/googleAuth.js";

const ADMIN_SESSION_ID = "admin_session";

// Generate secure session ID
export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

// Session middleware - checks for admin authentication
export function sessionMiddleware(req, res, next) {
  const sessionId = req.cookies?.sessionId || req.headers["x-session-id"];

  console.log("Session middleware check:", {
    hasCookie: !!req.cookies?.sessionId,
    hasHeader: !!req.headers["x-session-id"],
    sessionId: sessionId ? sessionId.substring(0, 10) + "..." : "none",
    hasTokenInStore: sessionId ? tokenStore.has(sessionId) : false,
    hasAdminToken: tokenStore.has(ADMIN_SESSION_ID)
  });

  if (sessionId && tokenStore.has(sessionId)) {
    req.sessionId = sessionId;
    req.tokens = tokenStore.get(sessionId);
    console.log("✅ Session found, tokens attached");
  } else {
    console.log("ℹ️ No user session (this is normal for public API calls)");
  }

  next();
}

// Require authentication middleware - checks if ADMIN token exists
export function requireAuth(req, res, next) {
  // Check if admin token exists (server-side)
  const adminTokens = tokenStore.get(ADMIN_SESSION_ID);
  
  if (!adminTokens || !adminTokens.access_token) {
    return res.status(503).json({
      success: false,
      error: "Service unavailable. Admin authentication required. Please contact administrator."
    });
  }

  // Attach admin tokens to request
  req.tokens = adminTokens;
  req.sessionId = ADMIN_SESSION_ID;
  
  next();
}