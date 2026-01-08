import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../utils/validation.utils.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);
router.patch('/profile', validate(updateProfileSchema), AuthController.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), AuthController.changePassword);

// Website management
router.post('/websites', AuthController.addWebsite);
router.delete('/websites/:domain', AuthController.removeWebsite);

export default router;