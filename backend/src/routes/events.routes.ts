import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent } from '../controllers/events.controller.js';
import { authAdminMiddleware } from '../middlewares/authAdmin.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authAdminMiddleware, createEvent);
router.patch('/:id', authAdminMiddleware, updateEvent);

export default router;
