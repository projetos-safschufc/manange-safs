import { query } from '../config/db.js';
import { config } from '../config/env.js';
import { getProfileNameSelect } from '../utils/dbSchema.js';

const schema = config.db.schema;

/**
 * Busca um usuário por email
 */
export const findUserByEmail = async (email) => {
  try {
    const profileSelect = await getProfileNameSelect();
    const result = await query(
      `SELECT u.*, ${profileSelect}
       FROM ${schema}.users u
       LEFT JOIN ${schema}.access_profile ap ON u.profile_id = ap.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  } catch (error) {
    // Se o JOIN falhar (tabela ou coluna não existe), busca sem JOIN
    if (error.code === '42703' || error.message.includes('does not exist')) {
      const result = await query(
        `SELECT u.*, NULL as profile_name
         FROM ${schema}.users u
         WHERE u.email = $1`,
        [email]
      );
      return result.rows[0];
    }
    throw error;
  }
};

/**
 * Busca um usuário por ID
 */
export const findUserById = async (id) => {
  try {
    const profileSelect = await getProfileNameSelect();
    const result = await query(
      `SELECT u.*, ${profileSelect}
       FROM ${schema}.users u
       LEFT JOIN ${schema}.access_profile ap ON u.profile_id = ap.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0];
  } catch (error) {
    // Se o JOIN falhar (tabela ou coluna não existe), busca sem JOIN
    if (error.code === '42703' || error.message.includes('does not exist')) {
      const result = await query(
        `SELECT u.*, NULL as profile_name
         FROM ${schema}.users u
         WHERE u.id = $1`,
        [id]
      );
      return result.rows[0];
    }
    throw error;
  }
};

/**
 * Cria um novo usuário
 */
export const createUser = async (userData) => {
  const { name, email, password_hash, profile_id } = userData;
  const result = await query(
    `INSERT INTO ${schema}.users (name, email, password_hash, profile_id, status, created_at)
     VALUES ($1, $2, $3, $4, 'ativo', NOW())
     RETURNING id, name, email, profile_id, status, created_at`,
    [name, email, password_hash, profile_id]
  );
  return result.rows[0];
};

/**
 * Lista usuários com paginação
 */
export const listUsers = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (filters.name) {
    whereClause += ` AND u.name ILIKE $${paramIndex}`;
    params.push(`%${filters.name}%`);
    paramIndex++;
  }

  if (filters.email) {
    whereClause += ` AND u.email ILIKE $${paramIndex}`;
    params.push(`%${filters.email}%`);
    paramIndex++;
  }

  if (filters.profile_id) {
    whereClause += ` AND u.profile_id = $${paramIndex}`;
    params.push(filters.profile_id);
    paramIndex++;
  }

  // Filtro por status (padrão: apenas ativos, mas pode incluir inativos se solicitado)
  if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
    if (filters.status === 'all') {
      // Mostra todos (ativos e inativos)
    } else {
      whereClause += ` AND u.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
  } else {
    // Por padrão, mostra apenas usuários ativos
    whereClause += ` AND u.status = 'ativo'`;
  }

  // Busca total de registros
  const countResult = await query(
    `SELECT COUNT(*) as total 
     FROM ${schema}.users u ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // Busca os registros
  params.push(limit, offset);
  try {
    const profileSelect = await getProfileNameSelect();
    const result = await query(
      `SELECT u.id, u.name, u.email, u.profile_id, u.status, u.created_at, ${profileSelect}
       FROM ${schema}.users u
       LEFT JOIN ${schema}.access_profile ap ON u.profile_id = ap.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    // Se o JOIN falhar (tabela ou coluna não existe), busca sem JOIN
    if (error.code === '42703' || error.message.includes('does not exist')) {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.profile_id, u.status, u.created_at, NULL as profile_name
         FROM ${schema}.users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
    throw error;
  }
};

/**
 * Atualiza um usuário
 */
export const updateUser = async (id, userData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (userData.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(userData.name);
  }
  if (userData.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(userData.email);
  }
  if (userData.password_hash !== undefined) {
    fields.push(`password_hash = $${paramIndex++}`);
    values.push(userData.password_hash);
  }
  if (userData.profile_id !== undefined) {
    fields.push(`profile_id = $${paramIndex++}`);
    values.push(userData.profile_id);
  }
  if (userData.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(userData.status);
  }

  if (fields.length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }

  values.push(id);
  const result = await query(
    `UPDATE ${schema}.users 
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING id, name, email, profile_id, status, updated_at`,
    values
  );

  return result.rows[0];
};

/**
 * Deleta um usuário permanentemente do banco de dados
 */
export const deleteUser = async (id) => {
  const result = await query(
    `DELETE FROM ${schema}.users 
     WHERE id = $1
     RETURNING id, name, email`,
    [id]
  );
  return result.rows[0];
};

/**
 * Busca perfis de acesso disponíveis
 */
export const getAccessProfiles = async () => {
  const { getProfileNameColumn } = await import('../utils/dbSchema.js');
  const profileColumn = await getProfileNameColumn();
  
  // Se não encontrar a coluna, tenta descobrir a estrutura
  if (!profileColumn) {
    try {
      const testResult = await query(
        `SELECT * FROM ${schema}.access_profile LIMIT 1`,
        []
      );
      
      if (testResult.rows.length > 0) {
        const columns = Object.keys(testResult.rows[0]);
        // Retorna todas as colunas disponíveis
        const columnList = columns.join(', ');
        const orderColumn = columns.find(col => 
          col.toLowerCase().includes('name') || 
          col.toLowerCase().includes('nome')
        ) || 'id';
        
        const result = await query(
          `SELECT ${columnList} 
           FROM ${schema}.access_profile
           ORDER BY ${orderColumn}`,
          []
        );
        
        // Mapeia para o formato esperado
        return result.rows.map(row => ({
          id: row.id,
          profile_name: row[profileColumn] || row.name || row.nome || row.profile || 'Perfil',
          description: row.description || null,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
    }
    
    // Fallback: retorna estrutura básica
    return [];
  }
  
  const result = await query(
    `SELECT id, ${profileColumn} as profile_name, description 
     FROM ${schema}.access_profile
     ORDER BY ${profileColumn}`,
    []
  );
  return result.rows;
};

