import * as catalogoModel from '../models/catalogoModel.js';

/**
 * Controller para criar item no catálogo
 */
export const createCatalogo = async (req, res, next) => {
  try {
    const catalogo = await catalogoModel.createCatalogo(req.body);
    res.status(201).json({
      message: 'Item do catálogo criado com sucesso',
      catalogo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para listar itens do catálogo
 */
export const listCatalogo = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Extrai filtros dos query params
    const filters = {};
    
    // Extrai cada filtro individualmente
    if (req.query.master && req.query.master.trim() !== '') {
      filters.master = req.query.master.trim();
    }
    if (req.query.descricao_mat && req.query.descricao_mat.trim() !== '') {
      filters.descricao_mat = req.query.descricao_mat.trim();
    }
    if (req.query.serv_aquisicao && req.query.serv_aquisicao.trim() !== '') {
      filters.serv_aquisicao = req.query.serv_aquisicao.trim();
    }
    if (req.query.gr && req.query.gr.trim() !== '') {
      filters.gr = req.query.gr.trim();
    }
    if (req.query.resp_controle && req.query.resp_controle.trim() !== '') {
      filters.resp_controle = req.query.resp_controle.trim();
    }

    const result = await catalogoModel.listCatalogo(page, limit, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para buscar item do catálogo por ID
 */
export const getCatalogoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catalogo = await catalogoModel.findCatalogoById(id);

    if (!catalogo) {
      return res.status(404).json({ error: 'Item do catálogo não encontrado' });
    }

    res.json(catalogo);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atualizar item do catálogo
 */
export const updateCatalogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catalogo = await catalogoModel.updateCatalogo(id, req.body);

    res.json({
      message: 'Item do catálogo atualizado com sucesso',
      catalogo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atribuir responsabilidade
 */
export const atribuirResponsabilidade = async (req, res, next) => {
  try {
    const { tipo, funcionario_id, filtro } = req.body;

    if (!tipo || !funcionario_id || !filtro) {
      return res.status(400).json({
        error: 'Campos obrigatórios: tipo, funcionario_id, filtro',
      });
    }

    const result = await catalogoModel.atribuirResponsabilidade({
      tipo,
      funcionario_id,
      filtro,
    });

    res.json({
      message: `Responsabilidade atribuída com sucesso. ${result.affectedRows} material(is) atualizado(s).`,
      affectedRows: result.affectedRows,
      materiais: result.materiais,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para deletar item do catálogo
 */
export const deleteCatalogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await catalogoModel.deleteCatalogo(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Item do catálogo não encontrado' });
    }

    res.json({
      message: 'Item do catálogo deletado com sucesso',
      id: deleted.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para listar grupos de materiais
 */
export const listGruposMateriais = async (req, res, next) => {
  try {
    const grupos = await catalogoModel.listGruposMateriais();
    res.json(grupos);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para listar serviços de aquisição únicos
 */
export const listServicosAquisicao = async (req, res, next) => {
  try {
    const servicos = await catalogoModel.listServicosAquisicao();
    console.log(`📋 Retornando ${servicos.length} serviços de aquisição`);
    
    // Garante que retorna um array mesmo se vazio
    if (!Array.isArray(servicos)) {
      console.warn('⚠️ Serviços não é um array, convertendo...');
      return res.json([]);
    }
    
    res.json(servicos);
  } catch (error) {
    console.error('❌ Erro no controller listServicosAquisicao:', error);
    console.error('❌ Detalhes:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Retorna erro estruturado
    res.status(500).json({ 
      error: 'Erro ao buscar serviços de aquisição',
      message: error.message 
    });
  }
};

/**
 * Controller para listar valores únicos de GR do catálogo
 */
export const listGruposCatalogo = async (req, res, next) => {
  try {
    const grupos = await catalogoModel.listGruposCatalogo();
    console.log(`📋 Retornando ${grupos.length} grupos do catálogo`);
    
    // Garante que retorna um array mesmo se vazio
    if (!Array.isArray(grupos)) {
      console.warn('⚠️ Grupos não é um array, convertendo...');
      return res.json([]);
    }
    
    res.json(grupos);
  } catch (error) {
    console.error('❌ Erro no controller listGruposCatalogo:', error);
    console.error('❌ Detalhes:', error.message);
    
    // Retorna erro estruturado
    res.status(500).json({ 
      error: 'Erro ao buscar grupos do catálogo',
      message: error.message 
    });
  }
};

/**
 * Controller para atualizar múltiplos itens do catálogo
 */
export const updateMultipleCatalogo = async (req, res, next) => {
  try {
    const { ids, updateData } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'IDs devem ser um array não vazio',
      });
    }

    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({
        error: 'updateData é obrigatório e deve ser um objeto',
      });
    }

    const result = await catalogoModel.updateMultipleCatalogo(ids, updateData);

    res.json({
      message: `${result.affectedRows} item(ns) do catálogo atualizado(s) com sucesso`,
      affectedRows: result.affectedRows,
      updatedItems: result.updatedItems,
    });
  } catch (error) {
    next(error);
  }
};

