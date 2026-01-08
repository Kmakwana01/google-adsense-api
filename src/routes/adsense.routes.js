import express from 'express';
import { AdsenseController } from '../controllers/adsense.controller.js';
import { ReportingController } from '../controllers/reporting.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/auth/check', AdsenseController.checkAuth);

// ============================================
// Basic Data Routes
// ============================================
router.get('/accounts', requireAuth, AdsenseController.getAccounts);
router.get('/sites/:accountId', requireAuth, AdsenseController.getSites);
router.get('/adunits/:accountId', requireAuth, AdsenseController.getAdUnits);
router.get('/earnings/:accountId', requireAuth, AdsenseController.getEarnings);
router.get('/payments/:accountId', requireAuth, AdsenseController.getPayments);
router.get('/alerts/:accountId', requireAuth, AdsenseController.getAlerts);

// ============================================
// Enhanced Reporting Routes
// ============================================

// Get comprehensive website report with all metrics
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), groupBy (DATE|DOMAIN)
router.get('/reports/websites/:accountId', requireAuth, ReportingController.getWebsiteReport);

// Get site-specific detailed report
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/reports/site/:accountId/:siteId', requireAuth, ReportingController.getSiteReport);

// Get dashboard summary with key metrics
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/reports/dashboard/:accountId', requireAuth, ReportingController.getDashboard);

export default router;