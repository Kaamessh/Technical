import { Router } from 'express';
import { getTeamsAdmin, createTeamAdmin, updateTeamAdmin, deleteTeamAdmin } from '../controllers/teamsAdmin.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.use(authAdminMiddleware);

router.get('/', getTeamsAdmin);
router.post('/', createTeamAdmin);
router.patch('/:id', updateTeamAdmin);
router.delete('/:id', deleteTeamAdmin);

export default router;
