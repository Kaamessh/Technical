import { Router } from 'express';
import {
  adjustPoints,
  getAdminTaskSettings,
  updateAdminTaskSettings,
  triggerSlotRecalculation,
  getSlotTaskAttempts,
  getTeamScoreBreakdown,
} from '../controllers/points.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/adjust', authAdminMiddleware, adjustPoints);
router.get('/task-settings', getAdminTaskSettings);
router.post('/task-settings', authAdminMiddleware, updateAdminTaskSettings);
router.post('/recalculate-slot/:slotId', authAdminMiddleware, triggerSlotRecalculation);
router.get('/task-attempts/:slotId', getSlotTaskAttempts);
router.get('/team-breakdown/:teamId', authAdminMiddleware, getTeamScoreBreakdown);

export default router;
