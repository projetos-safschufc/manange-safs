import { query } from '../config/db.js';
import { config } from '../config/env.js';
import { buildWhereClause, cleanFilters } from '../utils/filterHelpers.js';

const schema = config.db.schema;

/**
 * Cria um novo funcionário
 */
export const createFuncionario = async (funcionarioData) => {
  const { nome_func, setor_func, status, cargo } = funcionarioData;
  
  // Validação básica
  if (!nome_func || !nome_func.trim()) {
    throw new Error('Nome do funcionário é obrigatório');
  }
  if (!setor_func || !setor_func.trim()) {
    throw new Error('Setor é obrigatório');
  }
  
  // Remove valores vazios e converte para null se necessário
  const cleanNome = nome_func.trim();
  const cleanSetor = setor_func.trim();
  const cleanStatus = (status && status.trim()) || 'ativo';
  const cleanCargo = cargo && cargo.trim() !== '' ? cargo.trim() : null;
  
  console.log('📝 Valores limpos para inserção:', {
    nome_func: cleanNome,
    setor_func: cleanSetor,
    status: cleanStatus,
    cargo: cleanCargo,
  });
  
  try {
    const result = await query(
      `INSERT INTO ${schema}.safs_func (nome_func, setor_func, status, cargo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cleanNome, cleanSetor, cleanStatus, cleanCargo]
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Nenhum registro foi retornado após a inserção');
    }
    
    console.log('✅ Funcionário inserido com sucesso:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro na query INSERT:', error);
    // Melhora mensagem de erro para erros comuns do PostgreSQL
    if (error.code === '23505') {
      throw new Error('Já existe um funcionário com esses dados');
    } else if (error.code === '23502') {
      throw new Error('Campo obrigatório não foi fornecido');
    } else if (error.code === '42P01') {
      throw new Error(`Tabela ${schema}.safs_func não encontrada`);
    } else if (error.code === '42703') {
      throw new Error(`Coluna não encontrada na tabela ${schema}.safs_func: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Lista funcionários com filtros e paginação
 */
export const listFuncionarios = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  
  // Limpa e valida filtros
  const allowedFields = ['nome', 'setor', 'status', 'cargo'];
  const cleanedFilters = cleanFilters(filters);
  
  // Remove campos não permitidos silenciosamente
  const validFilters = {};
  Object.entries(cleanedFilters).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      validFilters[key] = value;
    }
  });

  // Mapeamento de campos para construção da query
  const fieldMappings = {
    nome: { field: 'nome_func', type: 'text' },
    setor: { field: 'setor_func', type: 'text' },
    cargo: { field: 'cargo', type: 'text' },
    status: { field: 'status', type: 'exact' },
  };

  // Constrói cláusula WHERE
  const { whereClause, params } = buildWhereClause(validFilters, fieldMappings);

  // Busca total de registros
  const countResult = await query(
    `SELECT COUNT(*) as total 
     FROM ${schema}.safs_func ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // Busca os registros com paginação
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  const result = await query(
    `SELECT * 
     FROM ${schema}.safs_func
     ${whereClause}
     ORDER BY nome_func ASC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    [...params, limit, offset]
  );

  return {
    funcionarios: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Busca um funcionário por ID
 */
export const findFuncionarioById = async (id) => {
  const result = await query(
    `SELECT * FROM ${schema}.safs_func WHERE id_func = $1`,
    [id]
  );
  return result.rows[0];
};

/**
 * Atualiza um funcionário
 */
export const updateFuncionario = async (id, funcionarioData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (funcionarioData.nome_func !== undefined) {
    fields.push(`nome_func = $${paramIndex++}`);
    values.push(funcionarioData.nome_func);
  }
  if (funcionarioData.setor_func !== undefined) {
    fields.push(`setor_func = $${paramIndex++}`);
    values.push(funcionarioData.setor_func);
  }
  if (funcionarioData.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(funcionarioData.status);
  }
  if (funcionarioData.cargo !== undefined) {
    fields.push(`cargo = $${paramIndex++}`);
    values.push(funcionarioData.cargo);
  }

  if (fields.length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }

  values.push(id);
  const result = await query(
    `UPDATE ${schema}.safs_func 
     SET ${fields.join(', ')}
     WHERE id_func = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Soft delete de funcionário (muda status para inativo)
 */
export const deleteFuncionario = async (id) => {
  const result = await query(
    `UPDATE ${schema}.safs_func 
     SET status = 'inativo'
     WHERE id_func = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
};

/**
 * Alterna o status do funcionário (ativo/inativo)
 */
export const toggleFuncionarioStatus = async (id) => {
  // Primeiro busca o status atual
  const current = await query(
    `SELECT status FROM ${schema}.safs_func WHERE id_func = $1`,
    [id]
  );
  
  if (current.rows.length === 0) {
    throw new Error('Funcionário não encontrado');
  }
  
  const newStatus = current.rows[0].status === 'ativo' ? 'inativo' : 'ativo';
  
  const result = await query(
    `UPDATE ${schema}.safs_func 
     SET status = $1
     WHERE id_func = $2
     RETURNING *`,
    [newStatus, id]
  );
  return result.rows[0];
};

