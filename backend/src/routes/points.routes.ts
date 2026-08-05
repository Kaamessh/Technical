import { Router } from 'express';
import { adjustPoints } from '../controllers/points.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.post('/adjust', authAdminMiddleware, adjustPoints);

export default router;
