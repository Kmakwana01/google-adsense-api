import { AdsenseService } from "../services/adsense.service.js";
import { CONSTANTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export class ReportingController {
  /**
   * Get comprehensive website report with all metrics
   * GET /api/reports/websites/:accountId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=DATE
   */
  static async getWebsiteReport(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, groupBy = "DATE" } = req.query;

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

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "startDate must be before or equal to endDate",
        });
      }

      // All available metrics for comprehensive reporting
      const metrics = [
        "ESTIMATED_EARNINGS",
        "IMPRESSIONS",
        "CLICKS",
        "COST_PER_CLICK",
        "PAGE_VIEWS_RPM",
        "PAGE_VIEWS",
        "AD_REQUESTS",
        "AD_REQUESTS_COVERAGE",
        "AD_REQUESTS_RPM",
        "MATCHED_AD_REQUESTS",
        "MATCHED_AD_REQUESTS_RPM",
      ];

      // Dimensions for grouping
      const dimensions = ["DATE", "DOMAIN_NAME"];
      if (
        groupBy &&
        !["DATE", "DOMAIN", "SITE"].includes(groupBy.toUpperCase())
      ) {
        logger.warn("Invalid groupBy parameter", { groupBy });
      }

      const data = await AdsenseService.getDetailedEarningsReport(
        accountId,
        startDate,
        endDate,
        req.tokens,
        metrics,
        dimensions
      );

      // Process and structure the data
      const processedData = ReportingController.processReportData(
        data,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: processedData,
        metadata: {
          accountId,
          startDate,
          endDate,
          metrics,
          dimensions,
        },
      });
    } catch (error) {
      logger.error("Get website report error", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to generate website report",
      });
    }
  }

  /**
   * Get site-specific report
   * GET /api/reports/site/:accountId/:siteId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getSiteReport(req, res) {
    try {
      const { accountId, siteId } = req.params;
      const { startDate, endDate } = req.query;

      if (!accountId || !siteId || !startDate || !endDate) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId, siteId, startDate, and endDate are required",
        });
      }

      const metrics = [
        "ESTIMATED_EARNINGS",
        "IMPRESSIONS",
        "CLICKS",
        "COST_PER_CLICK",
        "PAGE_VIEWS_RPM",
        "PAGE_VIEWS",
        "AD_REQUESTS",
      ];

      const data = await AdsenseService.getSiteEarningsReport(
        accountId,
        siteId,
        startDate,
        endDate,
        req.tokens,
        metrics
      );

      const rows = ReportingController.processSiteData(data);
      const summary = ReportingController.summarizeSiteRows(rows);

      res.json({
        success: true,
        data: {
          summary,
          byDate: rows,
        },
        metadata: { accountId, siteId, startDate, endDate },
      });
    } catch (error) {
      logger.error("Get site report error", {
        error: error.message,
        stack: error.stack,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to generate site report",
      });
    }
  }

  static summarizeSiteRows(rows) {
    const summary = {
      totalEarnings: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalPageViews: 0,
      totalAdRequests: 0,
      averageCPC: 0,
      averageRPM: 0,
      ctr: 0,
    };

    if (!rows || rows.length === 0) {
      return summary;
    }

    rows.forEach((row) => {
      const e = parseFloat(row.ESTIMATED_EARNINGS || "0");
      const imp = parseFloat(row.IMPRESSIONS || "0");
      const clicks = parseFloat(row.CLICKS || "0");
      const pv = parseFloat(row.PAGE_VIEWS || "0");
      const req = parseFloat(row.AD_REQUESTS || "0");
      const cpc = parseFloat(row.COST_PER_CLICK || "0");
      const rpm = parseFloat(row.PAGE_VIEWS_RPM || "0");

      summary.totalEarnings += e;
      summary.totalImpressions += imp;
      summary.totalClicks += clicks;
      summary.totalPageViews += pv;
      summary.totalAdRequests += req;

      // For averages, accumulate then divide by number of non‑zero days if you prefer,
      // here simple arithmetic mean over all days:
      summary.averageCPC += cpc;
      summary.averageRPM += rpm;
    });

    const days = rows.length || 1;
    summary.averageCPC = summary.averageCPC / days;
    summary.averageRPM = summary.averageRPM / days;

    summary.ctr = summary.totalImpressions
      ? (summary.totalClicks / summary.totalImpressions) * 100
      : 0;

    // Format to 2 decimals where makes sense
    summary.totalEarnings = Number(summary.totalEarnings.toFixed(2));
    summary.averageCPC = Number(summary.averageCPC.toFixed(4));
    summary.averageRPM = Number(summary.averageRPM.toFixed(2));
    summary.ctr = Number(summary.ctr.toFixed(2));

    return summary;
  }


  /**
   * Get summary dashboard data
   * GET /api/reports/dashboard/:accountId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getDashboard(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;

      if (!accountId || !startDate || !endDate) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CONSTANTS.ERRORS.INVALID_PARAMS,
          message: "accountId, startDate, and endDate are required",
        });
      }

      // Fetch all necessary data in parallel
      const [earnings, sites, alerts] = await Promise.all([
        AdsenseService.getDetailedEarningsReport(
          accountId,
          startDate,
          endDate,
          req.tokens,
          ["ESTIMATED_EARNINGS", "IMPRESSIONS", "CLICKS", "PAGE_VIEWS_RPM"],
          ["DATE", "DOMAIN_NAME"]
        ),
        AdsenseService.getSites(accountId, req.tokens),
        AdsenseService.getAlerts(accountId, req.tokens),
      ]);

      const dashboard = ReportingController.buildDashboard(
        earnings,
        sites,
        alerts
      );

      res.json({
        success: true,
        data: dashboard,
        metadata: { accountId, startDate, endDate },
      });
    } catch (error) {
      logger.error("Get dashboard error", {
        error: error.message,
        stack: error.stack,
      });
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: CONSTANTS.ERRORS.FETCH_FAILED,
        message: error.message || "Failed to generate dashboard",
      });
    }
  }

  // Helper methods
  static processReportData(data, startDate, endDate) {
    if (!data.rows || data.rows.length === 0) {
      return {
        summary: ReportingController.getEmptySummary(),
        byWebsite: [],
        byDate: [],
        timeRange: { startDate, endDate },
      };
    }

    const summary = ReportingController.calculateSummary(data);
    const byWebsite = ReportingController.groupByWebsite(data);
    const byDate = ReportingController.groupByDate(data);

    return {
      summary,
      byWebsite,
      byDate,
      timeRange: { startDate, endDate },
    };
  }

  static calculateSummary(data) {
    const headers = data.headers || [];
    const rows = data.rows || [];

    const metrics = {};
    headers.forEach((header, index) => {
      metrics[header.name] = rows.reduce((sum, row) => {
        const value = parseFloat(row.cells[index].value) || 0;
        return sum + value;
      }, 0);
    });

    return {
      totalEarnings: metrics.ESTIMATED_EARNINGS || 0,
      totalImpressions: metrics.IMPRESSIONS || 0,
      totalClicks: metrics.CLICKS || 0,
      averageCPC: metrics.COST_PER_CLICK || 0,
      averageRPM: metrics.PAGE_VIEWS_RPM || 0,
      totalPageViews: metrics.PAGE_VIEWS || 0,
      ctr: metrics.IMPRESSIONS
        ? ((metrics.CLICKS / metrics.IMPRESSIONS) * 100).toFixed(2)
        : 0,
    };
  }

  static groupByWebsite(data) {
    const websiteMap = new Map();
    const headers = data.headers || [];
    const rows = data.rows || [];

    const domainIndex = headers.findIndex((h) => h.name === "DOMAIN_NAME");
    if (domainIndex === -1) return [];

    rows.forEach((row) => {
      const domain = row.cells[domainIndex]?.value || "Unknown";

      if (!websiteMap.has(domain)) {
        websiteMap.set(domain, {
          domain,
          metrics: {},
        });
      }

      const site = websiteMap.get(domain);
      headers.forEach((header, index) => {
        if (header.name !== "DOMAIN_NAME" && header.name !== "DATE") {
          const value = parseFloat(row.cells[index].value) || 0;
          site.metrics[header.name] = (site.metrics[header.name] || 0) + value;
        }
      });
    });

    return Array.from(websiteMap.values()).sort(
      (a, b) =>
        (b.metrics.ESTIMATED_EARNINGS || 0) -
        (a.metrics.ESTIMATED_EARNINGS || 0)
    );
  }

  static groupByDate(data) {
    const dateMap = new Map();
    const headers = data.headers || [];
    const rows = data.rows || [];

    const dateIndex = headers.findIndex((h) => h.name === "DATE");
    if (dateIndex === -1) return [];

    rows.forEach((row) => {
      const date = row.cells[dateIndex]?.value || "Unknown";

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          metrics: {},
        });
      }

      const dateData = dateMap.get(date);
      headers.forEach((header, index) => {
        if (header.name !== "DATE" && header.name !== "DOMAIN_NAME") {
          const value = parseFloat(row.cells[index].value) || 0;
          dateData.metrics[header.name] =
            (dateData.metrics[header.name] || 0) + value;
        }
      });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  static processSiteData(data) {
    const headers = data.headers || [];
    const rows = data.rows || [];

    return rows.map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header.name] = row.cells[index].value;
      });
      return entry;
    });
  }

  static compareReports(period1, period2) {
    const summary1 = ReportingController.calculateSummary(period1);
    const summary2 = ReportingController.calculateSummary(period2);

    const calculateChange = (current, previous) => {
      if (!previous) return 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    return {
      period1: summary1,
      period2: summary2,
      changes: {
        earnings: calculateChange(
          summary1.totalEarnings,
          summary2.totalEarnings
        ),
        impressions: calculateChange(
          summary1.totalImpressions,
          summary2.totalImpressions
        ),
        clicks: calculateChange(summary1.totalClicks, summary2.totalClicks),
        rpm: calculateChange(summary1.averageRPM, summary2.averageRPM),
      },
    };
  }

  static buildDashboard(earnings, sites, alerts) {
    const summary = ReportingController.calculateSummary(earnings);
    const byWebsite = ReportingController.groupByWebsite(earnings);
    const byDate = ReportingController.groupByDate(earnings);

    return {
      summary,
      topWebsites: byWebsite.slice(0, 5),
      recentTrends: byDate.slice(-7),
      activeSites: sites.sites?.length || 0,
      alerts: alerts.alerts || [],
    };
  }

  static getEmptySummary() {
    return {
      totalEarnings: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageCPC: 0,
      averageRPM: 0,
      totalPageViews: 0,
      ctr: 0,
    };
  }
}
