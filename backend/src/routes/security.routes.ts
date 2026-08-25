import { Router } from 'express';
import {
  reportMalpractice,
  getMalpracticeLogsAdmin,
  clearMalpracticeLogsAdmin,
} from '../controllers/security.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

// Member report route (can be called with or without team JWT)
router.post('/report', reportMalpractice);

// Admin routes
router.get('/logs', authAdminMiddleware, getMalpracticeLogsAdmin);
router.delete('/logs/clear', authAdminMiddleware, clearMalpracticeLogsAdmin);

export default router;
