import * as funcionarioModel from '../models/funcionarioModel.js';

/**
 * Controller para criar funcionário
 */
export const createFuncionario = async (req, res, next) => {
  try {
    console.log('📝 Dados recebidos para criar funcionário:', req.body);
    const funcionario = await funcionarioModel.createFuncionario(req.body);
    console.log('✅ Funcionário criado com sucesso:', funcionario);
    res.status(201).json({
      message: 'Funcionário criado com sucesso',
      funcionario,
    });
  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    // Se for erro de banco de dados, fornece mais detalhes
    if (error.code) {
      console.error('   Código do erro PostgreSQL:', error.code);
    }
    next(error);
  }
};

/**
 * Controller para listar funcionários
 */
export const listFuncionarios = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Extrai filtros dos query params
    // Suporta formato direto: ?nome=bruno&setor=ULOG
    const filters = {};
    
    // Extrai cada filtro individualmente
    if (req.query.nome && req.query.nome.trim() !== '') {
      filters.nome = req.query.nome.trim();
    }
    if (req.query.setor && req.query.setor.trim() !== '') {
      filters.setor = req.query.setor.trim();
    }
    if (req.query.status && req.query.status.trim() !== '') {
      filters.status = req.query.status.trim();
    }
    if (req.query.cargo && req.query.cargo.trim() !== '') {
      filters.cargo = req.query.cargo.trim();
    }

    const result = await funcionarioModel.listFuncionarios(page, limit, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para buscar funcionário por ID
 */
export const getFuncionarioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funcionario = await funcionarioModel.findFuncionarioById(id);

    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(funcionario);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atualizar funcionário
 */
export const updateFuncionario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funcionario = await funcionarioModel.updateFuncionario(id, req.body);

    res.json({
      message: 'Funcionário atualizado com sucesso',
      funcionario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para deletar funcionário (soft delete)
 */
export const deleteFuncionario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funcionario = await funcionarioModel.deleteFuncionario(id);

    res.json({
      message: 'Funcionário desativado com sucesso',
      funcionario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para alternar status do funcionário (ativo/inativo)
 */
export const toggleFuncionarioStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funcionario = await funcionarioModel.toggleFuncionarioStatus(id);

    res.json({
      message: `Funcionário ${funcionario.status === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      funcionario,
    });
  } catch (error) {
    next(error);
  }
};

