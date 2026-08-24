import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, requireCsrf } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

const router = Router();

router.get('/csrf', AuthController.csrf);
router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh', authRateLimiter, requireCsrf, AuthController.refresh);
router.post('/logout', requireCsrf, AuthController.logout);
router.post('/logout-all', authenticate, requireCsrf, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.me);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.post(
  '/change-password',
  authenticate,
  requireCsrf,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

export default router;
