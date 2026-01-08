import fs from "fs/promises";
import path from "path";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "./logger.js";
import { getOAuth2Client } from "../config/googleAuth.js";

class TokenManager {
  constructor() {
    this.tokenStore = new Map();
    this.tokenFilePath = path.join(process.cwd(), CONSTANTS.TOKEN_FILE_PATH);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    await this.loadTokens();
    this.initialized = true;
  }

  async loadTokens() {
    try {
      const data = await fs.readFile(this.tokenFilePath, "utf8");
      const tokens = JSON.parse(data);

      if (tokens.access_token && !tokens.expiry_date) {
        tokens.expiry_date = Date.now() + (tokens.expires_in || 3599) * 1000;
      }

      this.tokenStore.set(CONSTANTS.ADMIN_SESSION_ID, tokens);
      logger.info("Admin tokens loaded successfully", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown'
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        logger.warn("No saved tokens found. Admin authentication required.");
      } else {
        logger.error("Error loading tokens", { error: error.message });
      }
    }
  }

  async saveTokens(tokens) {
    // 🔒 IMPORTANT: preserve refresh_token forever
    const existing = this.getTokens();

    const tokenData = {
      ...existing,
      ...tokens,
      refresh_token: existing?.refresh_token || tokens.refresh_token,
      created: Date.now(),
      expiry_date:
        tokens.expiry_date || Date.now() + (tokens.expires_in || 3599) * 1000,
    };

    // ✅ Update in-memory store FIRST
    this.tokenStore.set(CONSTANTS.ADMIN_SESSION_ID, tokenData);

    // ✅ Then save to file
    await fs.writeFile(this.tokenFilePath, JSON.stringify(tokenData, null, 2));

    logger.info("Admin tokens saved and reloaded successfully", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresAt: new Date(tokenData.expiry_date).toISOString()
    });
  }

  getTokens() {
    return this.tokenStore.get(CONSTANTS.ADMIN_SESSION_ID);
  }

  async deleteTokens() {
    this.tokenStore.delete(CONSTANTS.ADMIN_SESSION_ID);
    try {
      await fs.unlink(this.tokenFilePath);
      logger.info("Tokens deleted successfully");
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.error("Error deleting token file", { error: error.message });
      }
    }
  }

  async refreshTokenIfNeeded(tokens) {
    if (!tokens?.refresh_token) {
      throw new Error("Missing refresh token");
    }

    const now = Date.now();
    const expiryDate = tokens.expiry_date || 0;

    const needsRefresh = expiryDate - now < CONSTANTS.TOKEN_EXPIRY_BUFFER_MS;

    if (!needsRefresh) {
      logger.debug("Token still valid", {
        expiresIn: Math.round((expiryDate - now) / 1000) + "s"
      });
      return tokens;
    }

    logger.info("Refreshing access token", {
      expiredAt: new Date(expiryDate).toISOString()
    });

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() - 1000, // Force refresh
    });

    try {
      // ✅ Get new access token
      const { token } = await oauth2Client.getAccessToken();

      if (!token) {
        throw new Error("Failed to get new access token");
      }

      const newTokens = {
        ...tokens,
        access_token: token,
        expiry_date: Date.now() + 3600 * 1000, // 1 hour
      };

      // ✅ Save tokens (this updates both memory and file)
      await this.saveTokens(newTokens);
      
      logger.info("Access token refreshed successfully", {
        newExpiryDate: new Date(newTokens.expiry_date).toISOString()
      });

      return newTokens;
    } catch (error) {
      logger.error("Token refresh failed", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(CONSTANTS.ERRORS.TOKEN_REFRESH_FAILED);
    }
  }

  hasValidTokens() {
    const tokens = this.getTokens();
    return !!(tokens?.access_token && tokens?.refresh_token);
  }
}

export const tokenManager = new TokenManager();