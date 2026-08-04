import { Router } from 'express';
import { createQuizQuestion, getQuizQuestionsByEvent, deleteQuizQuestion } from '../controllers/questions.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.post('/round1', authAdminMiddleware, createQuizQuestion);
router.get('/round1/event/:eventId', getQuizQuestionsByEvent);
router.delete('/round1/:id', authAdminMiddleware, deleteQuizQuestion);

export default router;
