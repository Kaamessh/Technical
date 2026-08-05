import { Router } from 'express';
import { getSlotLeaderboard, getGlobalLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/slot/:slotId', getSlotLeaderboard);
router.get('/global/:eventId', getGlobalLeaderboard);

export default router;
