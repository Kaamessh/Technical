import { Router } from 'express';
import { 
  getDecodePool, 
  addWordToPool, 
  removeWordFromPool, 
  bulkGenerateForSlot, 
  getDecodeWordsByEvent 
} from '../controllers/decodeWords.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

// Pool endpoints
router.get('/pool/:eventId', authAdminMiddleware, getDecodePool);
router.post('/pool', authAdminMiddleware, addWordToPool);
router.delete('/pool/:eventId/:wordId', authAdminMiddleware, removeWordFromPool);

// Legacy/existing
router.post('/bulk-slot', authAdminMiddleware, bulkGenerateForSlot);
router.get('/event/:eventId', getDecodeWordsByEvent);

export default router;
