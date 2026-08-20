import { Router } from 'express';
import {
  getProblemStatements,
  addProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  getSlotClaims,
} from '../controllers/problemStatements.controller';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware';

const router = Router();

router.get('/event/:eventId', getProblemStatements);
router.post('/', authAdminMiddleware, addProblemStatement);
router.put('/:id', authAdminMiddleware, updateProblemStatement);
router.delete('/:id', authAdminMiddleware, deleteProblemStatement);
router.get('/slot/:slotId/claims', getSlotClaims);

export default router;
