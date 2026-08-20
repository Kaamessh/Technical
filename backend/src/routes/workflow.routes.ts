import { Router } from 'express';
import {
  createWorkflowChallenge,
  getWorkflowChallengesByEvent,
  updateWorkflowChallenge,
  deleteWorkflowChallenge,
} from '../controllers/workflow.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/', authAdminMiddleware, createWorkflowChallenge);
router.get('/event/:eventId', getWorkflowChallengesByEvent);
router.put('/:id', authAdminMiddleware, updateWorkflowChallenge);
router.delete('/:id', authAdminMiddleware, deleteWorkflowChallenge);

export default router;
