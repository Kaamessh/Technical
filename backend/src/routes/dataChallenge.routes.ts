import { Router } from 'express';
import { createDataChallengeQuestion, getDataChallengeQuestionsByEvent, deleteDataChallengeQuestion } from '../controllers/dataChallenge.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/', authAdminMiddleware, createDataChallengeQuestion);
router.get('/event/:eventId', getDataChallengeQuestionsByEvent);
router.delete('/:id', authAdminMiddleware, deleteDataChallengeQuestion);

export default router;
