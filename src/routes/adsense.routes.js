import express from 'express';
import { AdsenseController } from '../controllers/adsense.controller.js';
import { ReportingController } from '../controllers/reporting.controller.js';
import { authenticate, requireAdminAdsenseAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Check admin auth status (no user auth required)
router.get('/auth/check', AdsenseController.checkAuth);

// All routes below require user authentication AND admin AdSense auth
router.use(authenticate);
router.use(requireAdminAdsenseAuth);

// Basic Data Routes
router.get('/accounts', AdsenseController.getAccounts);
router.get('/sites/:accountId', AdsenseController.getSites);
router.get('/adunits/:accountId', AdsenseController.getAdUnits);
router.get('/earnings/:accountId', AdsenseController.getEarnings);
router.get('/payments/:accountId', AdsenseController.getPayments);
router.get('/alerts/:accountId', AdsenseController.getAlerts);

// Enhanced Reporting Routes
router.get('/reports/websites/:accountId', ReportingController.getWebsiteReport);
router.get('/reports/site/:accountId/:siteId', ReportingController.getSiteReport);
router.get('/reports/dashboard/:accountId', ReportingController.getDashboard);

export default router;