import { Router } from 'express';
import { upsertTeamDecodeWord, bulkGenerateForSlot, getDecodeWordsByEvent } from '../controllers/decodeWords.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.post('/', authAdminMiddleware, upsertTeamDecodeWord);
router.post('/bulk-slot', authAdminMiddleware, bulkGenerateForSlot);
router.get('/event/:eventId', getDecodeWordsByEvent);

export default router;
