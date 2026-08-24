import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireAdmin, requireCsrf } from '../middleware/auth.middleware';
import { adminAuditLogger } from '../middleware/adminAuditLogger';
import { validateRequest } from '../middleware/validateRequest';
import { adminUserQuerySchema, updateRoleSchema, updateStatusSchema } from '../validators/auth.validators';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', AdminController.overview);
router.get('/users', validateRequest(adminUserQuerySchema), AdminController.listUsers);
router.get('/users/:id', AdminController.getUser);
router.patch('/users/:id/role', requireCsrf, validateRequest(updateRoleSchema), adminAuditLogger('admin.patch_role'), AdminController.updateRole);
router.patch('/users/:id/status', requireCsrf, validateRequest(updateStatusSchema), adminAuditLogger('admin.patch_status'), AdminController.updateStatus);
router.get('/sessions', AdminController.sessions);
router.get('/audit-logs', AdminController.auditLogs);
router.get('/system-health', AdminController.systemHealth);
router.get('/prediction-monitoring', AdminController.predictionMonitoring);

export default router;
