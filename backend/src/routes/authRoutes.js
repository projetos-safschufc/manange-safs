import express from 'express';
import { login, refreshToken } from '../controllers/authController.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';
import { validateLogin } from '../middlewares/validators.js';

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refreshToken);

export default router;

