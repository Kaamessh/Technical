import { Router } from 'express';
import { adminRegister, adminLogin, teamRegister, teamLogin } from '../controllers/auth.controller.js';

const router = Router();

router.post('/admin/register', adminRegister);
router.post('/admin/login', adminLogin);
router.post('/team/register', teamRegister);
router.post('/team/login', teamLogin);

export default router;
