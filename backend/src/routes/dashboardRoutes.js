import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rota para estatísticas do dashboard
router.get('/stats', dashboardController.getStats);

export default router;

