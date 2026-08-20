import { Router } from 'express';
import {
  createQuizQuestion,
  getQuizQuestionsByEvent,
  updateQuizQuestion,
  deleteQuizQuestion,
} from '../controllers/questions.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/round1', authAdminMiddleware, createQuizQuestion);
router.get('/round1/event/:eventId', getQuizQuestionsByEvent);
router.put('/round1/:id', authAdminMiddleware, updateQuizQuestion);
router.delete('/round1/:id', authAdminMiddleware, deleteQuizQuestion);

export default router;
