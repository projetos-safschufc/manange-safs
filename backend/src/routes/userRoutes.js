import express from 'express';
import * as userController from '../controllers/userController.js';
import * as registerController from '../controllers/registerController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateCreateUser, validateUpdateUser, validateRegister } from '../middlewares/validators.js';

const router = express.Router();

// Rotas públicas
router.get('/profiles', userController.getAccessProfiles);
router.post('/register', validateRegister, registerController.register); // Cadastro público - sempre disponível, atribui perfil 3
router.post('/public', validateCreateUser, userController.createPublicUser); // Cadastro público (apenas se não houver usuários) - mantido para compatibilidade

// Rotas protegidas
router.post('/', authenticate, authorize(['admin']), validateCreateUser, userController.createUser);
router.get('/', authenticate, authorize(['admin']), userController.listUsers); // Apenas ADMIN pode listar
router.get('/:id', authenticate, authorize(['admin']), userController.getUserById); // Apenas ADMIN pode ver detalhes
router.put('/:id', authenticate, authorize(['admin']), validateUpdateUser, userController.updateUser);
router.patch('/:id/profile', authenticate, authorize(['admin']), userController.updateUserProfile);
router.patch('/:id/status', authenticate, authorize(['admin']), userController.updateUserStatus);
router.delete('/:id', authenticate, authorize(['admin']), userController.deleteUser);

export default router;

