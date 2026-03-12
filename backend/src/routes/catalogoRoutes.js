import express from 'express';
import * as catalogoController from '../controllers/catalogoController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateCatalogo, validateAtribuirResponsabilidade } from '../middlewares/validators.js';
import { filterLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas públicas (autenticadas, mas não requerem ADMIN)
// Endpoints de filtros usam rate limiter mais permissivo
router.get('/', catalogoController.listCatalogo);
router.get('/grupos', filterLimiter, catalogoController.listGruposMateriais);
router.get('/grupos-catalogo', filterLimiter, catalogoController.listGruposCatalogo);
router.get('/servicos-aquisicao', filterLimiter, catalogoController.listServicosAquisicao);
router.get('/:id', catalogoController.getCatalogoById);
router.post('/atribuir-responsabilidade', validateAtribuirResponsabilidade, catalogoController.atribuirResponsabilidade);
router.post('/update-multiple', catalogoController.updateMultipleCatalogo);

// Rotas que requerem ADMIN
router.post('/', authorize(['admin']), validateCatalogo, catalogoController.createCatalogo);
router.put('/:id', authorize(['admin']), validateCatalogo, catalogoController.updateCatalogo);
router.delete('/:id', authorize(['admin']), catalogoController.deleteCatalogo);

export default router;

