import { Router } from 'express';
import { adjustPoints } from '../controllers/points.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.post('/adjust', authAdminMiddleware, adjustPoints);

export default router;
