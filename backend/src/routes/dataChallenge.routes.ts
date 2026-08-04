import { Router } from 'express';
import { createDataChallengeQuestion, getDataChallengeQuestionsByEvent, deleteDataChallengeQuestion } from '../controllers/dataChallenge.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.post('/', authAdminMiddleware, createDataChallengeQuestion);
router.get('/event/:eventId', getDataChallengeQuestionsByEvent);
router.delete('/:id', authAdminMiddleware, deleteDataChallengeQuestion);

export default router;
