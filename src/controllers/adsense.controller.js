import { AdsenseService } from "../services/adsense.service.js";
import { tokenManager } from "../utils/tokenManager.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export class AdsenseController {
  static pendingStates = new Map();

  static async checkAuth(req, res) {
    try {
      const hasValidTokens = tokenManager.hasValidTokens();
      const tokens = tokenManager.getTokens();

      res.json({
        success: true,
        authenticated: hasValidTokens,
        message: hasValidTokens
          ? "Admin is authenticated"
          : CONSTANTS.ERRORS.ADMIN_AUTH_REQUIRED,
        tokenInfo: hasValidTokens
          ? {
              hasRefreshToken: !!tokens.refresh_token,
              createdAt: tokens.created
                ? new Date(tokens.created).toISOString()
                : null,
              expiresAt: tokens.expiry_date
                ? new Date(tokens.expiry_date).toISOString()
                : null,
            }
          : null,
      });
    } catch (error) {
      logger.error("Check auth error", {
        error: error.message,
        stack: error.stack,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to check authentication status",
      });
    }
  }

  static async getAccounts(req, res) {
    try {
      const data = await AdsenseService.getAccounts(req.tokens);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get accounts error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch accounts",
      });
    }
  }

  static async getSites(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId is required",
        });
      }

      const data = await AdsenseService.getSites(accountId, req.tokens);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get sites error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch sites",
      });
    }
  }

  static async getAdUnits(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId is required",
        });
      }

      const data = await AdsenseService.getAdUnits(accountId, req.tokens);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get ad units error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch ad units",
      });
    }
  }

  static async getEarnings(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, metrics } = req.query;

      if (!accountId || !startDate || !endDate) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message:
            "accountId, startDate (YYYY-MM-DD), and endDate (YYYY-MM-DD) are required",
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "Dates must be in YYYY-MM-DD format",
        });
      }

      const metricsArray = metrics ? metrics.split(",") : null;

      const data = await AdsenseService.getEarnings(
        accountId,
        startDate,
        endDate,
        req.tokens,
        metricsArray
      );

      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get earnings error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch earnings",
      });
    }
  }

  static async getPayments(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId is required",
        });
      }

      const data = await AdsenseService.getPayments(accountId, req.tokens);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get payments error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch payments",
      });
    }
  }

  static async getAlerts(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId is required",
        });
      }

      const data = await AdsenseService.getAlerts(accountId, req.tokens);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      logger.error("Get alerts error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to fetch alerts",
      });
    }
  }

  static cleanupOldStates() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, data] of this.pendingStates.entries()) {
      if (data.created < tenMinutesAgo) {
        this.pendingStates.delete(state);
      }
    }
  }

  static generateSuccessPage() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Authentication Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .success { 
            background: white; 
            padding: 48px; 
            border-radius: 16px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
            text-align: center; 
            max-width: 500px;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .success h1 { 
            color: #10b981; 
            margin: 0 0 24px 0; 
            font-size: 32px;
          }
          .success p { 
            color: #6b7280; 
            margin: 12px 0; 
            line-height: 1.6;
          }
          .success strong { 
            color: #374151;
          }
          .success code { 
            background: #f3f4f6; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 14px; 
            color: #1f2937;
            display: inline-block;
            margin-top: 16px;
          }
          .checkmark {
            font-size: 64px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <div class="checkmark">✓</div>
          <h1>Authentication Successful!</h1>
          <p><strong>Admin tokens have been saved successfully.</strong></p>
          <p>Your API is now ready to use.</p>
          <p>Authentication will persist across server restarts.</p>
          <p>
            <strong>Test your API:</strong><br>
            <code>GET /api/adsense/accounts</code>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  static generateErrorPage(errorMessage) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Authentication Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .error { 
            background: white; 
            padding: 48px; 
            border-radius: 16px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
            text-align: center; 
            max-width: 500px;
          }
          .error h1 { 
            color: #ef4444; 
            margin: 0 0 24px 0; 
            font-size: 32px;
          }
          .error p { 
            color: #6b7280; 
            line-height: 1.6;
          }
          .error-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="error">
          <div class="error-icon">✕</div>
          <h1>Authentication Failed</h1>
          <p>${errorMessage}</p>
          <p>
            Please try again or contact support.
          </p>
        </div>
      </body>
      </html>
    `;
  }
  
}
