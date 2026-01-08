import { google } from "googleapis";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export class AdsenseService {
  static createAuthClient(tokens) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials(tokens);
    return client;
  }

  static async getAccounts(tokens) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const response = await adsense.accounts.list();
      logger.info("Accounts fetched successfully");
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch accounts", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  static async getSites(accountId, tokens) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const response = await adsense.accounts.sites.list({
        parent: `accounts/${accountId}`,
      });

      logger.info("Sites fetched successfully", { accountId });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch sites", {
        accountId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  static async getAdUnits(accountId, tokens) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const adClientsResponse = await adsense.accounts.adclients.list({
        parent: `accounts/${accountId}`,
      });

      if (
        !adClientsResponse.data.adClients ||
        adClientsResponse.data.adClients.length === 0
      ) {
        logger.warn("No ad clients found", { accountId });
        return { adUnits: [] };
      }

      const allAdUnits = [];

      for (const adClient of adClientsResponse.data.adClients) {
        try {
          const adUnitsResponse = await adsense.accounts.adclients.adunits.list(
            {
              parent: adClient.name,
            }
          );

          if (adUnitsResponse.data.adUnits) {
            allAdUnits.push(...adUnitsResponse.data.adUnits);
          }
        } catch (error) {
          logger.warn("Failed to fetch ad units for ad client", {
            adClient: adClient.name,
            error: error.message,
          });
        }
      }

      logger.info("Ad units fetched successfully", {
        accountId,
        totalAdUnits: allAdUnits.length,
      });

      return {
        adUnits: allAdUnits,
        adClients: adClientsResponse.data.adClients,
      };
    } catch (error) {
      logger.error("Failed to fetch ad units", {
        accountId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  static async getEarnings(
    accountId,
    startDate,
    endDate,
    tokens,
    metrics = null
  ) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const defaultMetrics = [
        "ESTIMATED_EARNINGS",
        "IMPRESSIONS",
        "CLICKS",
        "COST_PER_CLICK",
        "PAGE_VIEWS_RPM",
      ];

      const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return { year, month, day };
      };

      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);

      const requestParams = {
        account: `accounts/${accountId}`,
        dateRange: "CUSTOM",
        "startDate.year": parsedStartDate.year,
        "startDate.month": parsedStartDate.month,
        "startDate.day": parsedStartDate.day,
        "endDate.year": parsedEndDate.year,
        "endDate.month": parsedEndDate.month,
        "endDate.day": parsedEndDate.day,
        metrics: metrics || defaultMetrics,
      };

      const response = await adsense.accounts.reports.generate(requestParams);

      logger.info("Earnings report generated successfully", {
        accountId,
        startDate,
        endDate,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to fetch earnings", {
        accountId,
        startDate,
        endDate,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get detailed earnings report with dimensions (for grouping by date, domain, etc.)
   */
  static async getDetailedEarningsReport(
    accountId,
    startDate,
    endDate,
    tokens,
    metrics = null,
    dimensions = null
  ) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const defaultMetrics = [
        "ESTIMATED_EARNINGS",
        "IMPRESSIONS",
        "CLICKS",
        "COST_PER_CLICK",
        "PAGE_VIEWS_RPM",
        "PAGE_VIEWS",
        "AD_REQUESTS",
        "MATCHED_AD_REQUESTS",
      ];

      const defaultDimensions = ["DATE", "DOMAIN_NAME"];

      const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return { year, month, day };
      };

      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);

      const requestParams = {
        account: `accounts/${accountId}`,
        dateRange: "CUSTOM",
        "startDate.year": parsedStartDate.year,
        "startDate.month": parsedStartDate.month,
        "startDate.day": parsedStartDate.day,
        "endDate.year": parsedEndDate.year,
        "endDate.month": parsedEndDate.month,
        "endDate.day": parsedEndDate.day,
        metrics: metrics || defaultMetrics,
        dimensions: dimensions || defaultDimensions,
      };

      const response = await adsense.accounts.reports.generate(requestParams);

      logger.info("Detailed earnings report generated successfully", {
        accountId,
        startDate,
        endDate,
        dimensions: requestParams.dimensions,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to fetch detailed earnings", {
        accountId,
        startDate,
        endDate,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get site-specific earnings report
   */
  static async getSiteEarningsReport(
    accountId,
    siteId,
    startDate,
    endDate,
    tokens,
    metrics = null
  ) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const defaultMetrics = [
        "ESTIMATED_EARNINGS",
        "IMPRESSIONS",
        "CLICKS",
        "COST_PER_CLICK",
        "PAGE_VIEWS_RPM",
        "PAGE_VIEWS",
      ];

      const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return { year, month, day };
      };

      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);

      const requestParams = {
        account: `accounts/${accountId}`,
        dateRange: "CUSTOM",
        "startDate.year": parsedStartDate.year,
        "startDate.month": parsedStartDate.month,
        "startDate.day": parsedStartDate.day,
        "endDate.year": parsedEndDate.year,
        "endDate.month": parsedEndDate.month,
        "endDate.day": parsedEndDate.day,
        metrics: metrics || defaultMetrics,
        dimensions: ["DATE"],
        filters: [`DOMAIN_NAME==${siteId}`],
      };

      const response = await adsense.accounts.reports.generate(requestParams);

      logger.info("Site earnings report generated successfully", {
        accountId,
        siteId,
        startDate,
        endDate,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to fetch site earnings", {
        accountId,
        siteId,
        startDate,
        endDate,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  static async getPayments(accountId, tokens) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const response = await adsense.accounts.payments.list({
        parent: `accounts/${accountId}`,
      });

      logger.info("Payments fetched successfully", { accountId });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch payments", {
        accountId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  static async getAlerts(accountId, tokens) {
    try {
      const auth = this.createAuthClient(tokens);
      const adsense = google.adsense({ version: CONSTANTS.API_VERSION, auth });

      const response = await adsense.accounts.alerts.list({
        parent: `accounts/${accountId}`,
      });

      logger.info("Alerts fetched successfully", { accountId });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch alerts", {
        accountId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }
}