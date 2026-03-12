import express from 'express';
import * as funcionarioController from '../controllers/funcionarioController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateFuncionario } from '../middlewares/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas públicas (autenticadas, mas não requerem ADMIN)
router.get('/', funcionarioController.listFuncionarios);
router.get('/:id', funcionarioController.getFuncionarioById);

// Rotas que requerem ADMIN
router.post('/', authorize(['admin']), validateFuncionario, funcionarioController.createFuncionario);
router.put('/:id', authorize(['admin']), validateFuncionario, funcionarioController.updateFuncionario);
router.patch('/:id/toggle-status', authorize(['admin']), funcionarioController.toggleFuncionarioStatus);
router.delete('/:id', authorize(['admin']), funcionarioController.deleteFuncionario);

export default router;

