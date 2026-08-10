import { Router } from 'express';
import { createSlot, getSlotsByEvent, getSlotStatus, joinSlot, updateSlotStatus, deleteSlot } from '../controllers/slots.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';
import { authTeamMiddleware } from '../middlewares/authTeam.middleware';

const router = Router();

router.post('/', authAdminMiddleware, createSlot);
router.get('/event/:eventId', getSlotsByEvent);
router.get('/:id/status', getSlotStatus);
router.post('/join', authTeamMiddleware, joinSlot);
router.patch('/:id', authAdminMiddleware, updateSlotStatus);
router.delete('/:id', authAdminMiddleware, deleteSlot);

export default router;
