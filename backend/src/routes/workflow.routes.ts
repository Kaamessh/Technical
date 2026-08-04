import { Router } from 'express';
import { createWorkflowChallenge, getWorkflowChallengesByEvent, deleteWorkflowChallenge } from '../controllers/workflow.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.post('/', authAdminMiddleware, createWorkflowChallenge);
router.get('/event/:eventId', getWorkflowChallengesByEvent);
router.delete('/:id', authAdminMiddleware, deleteWorkflowChallenge);

export default router;
