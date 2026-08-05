import { Router } from 'express';
import { createAiOrRealChallenge, getAiOrRealChallengesByEvent, deleteAiOrRealChallenge } from '../controllers/aiOrReal.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/', authAdminMiddleware, createAiOrRealChallenge);
router.get('/event/:eventId', getAiOrRealChallengesByEvent);
router.delete('/:id', authAdminMiddleware, deleteAiOrRealChallenge);

export default router;
