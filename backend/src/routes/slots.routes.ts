import { Router } from 'express';
import { createSlot, getSlotsByEvent, getSlotStatus, joinSlot, updateSlotStatus } from '../controllers/slots.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';
import { authTeamMiddleware } from '../middlewares/authTeam.middleware.js';

const router = Router();

router.post('/', authAdminMiddleware, createSlot);
router.get('/event/:eventId', getSlotsByEvent);
router.get('/:id/status', getSlotStatus);
router.post('/join', authTeamMiddleware, joinSlot);
router.patch('/:id', authAdminMiddleware, updateSlotStatus);

export default router;
