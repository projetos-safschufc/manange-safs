import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel.js';

/**
 * Controller para criar usuário público (cadastro de novos usuários)
 * Atribui automaticamente o perfil ID 3 se não especificado
 */
export const createPublicUser = async (req, res, next) => {
  try {
    const { name, email, password, profile_id } = req.body;

    // Verifica se o email já existe
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // Se não houver perfil especificado, usa o perfil padrão ID 3
    let finalProfileId = profile_id || 3;

    // Valida se o perfil existe
    try {
      const { query } = await import('../config/db.js');
      const { config } = await import('../config/env.js');
      const profileCheck = await query(
        `SELECT id FROM ${config.db.schema}.access_profile WHERE id = $1`,
        [finalProfileId]
      );
      
      if (profileCheck.rows.length === 0) {
        return res.status(400).json({ 
          error: `Perfil com ID ${finalProfileId} não encontrado` 
        });
      }
    } catch (error) {
      // Se a tabela não existir, continua com o perfil 3
      console.warn('⚠️  Não foi possível validar o perfil, usando perfil 3 por padrão');
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = await userModel.createUser({
      name,
      email,
      password_hash,
      profile_id: finalProfileId,
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_id: user.profile_id,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para criar usuário
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, profile_id } = req.body;

    // Verifica se o email já existe
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = await userModel.createUser({
      name,
      email,
      password_hash,
      profile_id,
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_id: user.profile_id,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para listar usuários
 */
export const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Processa filtro de status: 'all' mostra todos, caso contrário filtra por status específico
    let statusFilter = req.query.status;
    if (!statusFilter || statusFilter === '') {
      statusFilter = 'ativo'; // Por padrão mostra apenas ativos
    }

    const filters = {
      name: req.query.name,
      email: req.query.email,
      profile_id: req.query.profile_id ? parseInt(req.query.profile_id) : undefined,
      status: statusFilter,
    };

    const result = await userModel.listUsers(page, limit, filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para buscar usuário por ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove a senha antes de retornar
    delete user.password_hash;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atualizar usuário
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Se houver senha, faz hash
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }

    // Verifica se o email já existe (se estiver sendo alterado)
    if (updateData.email) {
      const existingUser = await userModel.findUserByEmail(updateData.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ 
          error: 'Email já cadastrado para outro usuário' 
        });
      }
    }

    const user = await userModel.updateUser(id, updateData);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para listar perfis de acesso
 */
export const getAccessProfiles = async (req, res, next) => {
  try {
    const profiles = await userModel.getAccessProfiles();
    res.json(profiles);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atualizar apenas o perfil de um usuário
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({ 
        error: 'profile_id é obrigatório' 
      });
    }

    // Valida se o perfil existe
    try {
      const { query } = await import('../config/db.js');
      const { config } = await import('../config/env.js');
      const profileCheck = await query(
        `SELECT id FROM ${config.db.schema}.access_profile WHERE id = $1`,
        [profile_id]
      );
      
      if (profileCheck.rows.length === 0) {
        return res.status(400).json({ 
          error: `Perfil com ID ${profile_id} não encontrado` 
        });
      }
    } catch (error) {
      console.warn('⚠️  Não foi possível validar o perfil:', error.message);
    }

    const user = await userModel.updateUser(id, { profile_id });

    res.json({
      message: 'Perfil do usuário atualizado com sucesso',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para atualizar apenas o status de um usuário
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({ 
        error: 'status deve ser "ativo" ou "inativo"' 
      });
    }

    // Não permite desativar a si mesmo
    if (parseInt(id) === req.user.id && status === 'inativo') {
      return res.status(400).json({ 
        error: 'Você não pode desativar seu próprio usuário' 
      });
    }

    const user = await userModel.updateUser(id, { status });

    res.json({
      message: `Status do usuário atualizado para "${status}"`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para deletar usuário permanentemente
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Não permite deletar a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'Você não pode deletar seu próprio usuário' 
      });
    }

    // Verifica se o usuário existe
    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    // Hard delete: remove permanentemente do banco de dados
    const deletedUser = await userModel.deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado ou já foi deletado' 
      });
    }

    res.json({
      message: 'Usuário deletado permanentemente com sucesso',
      user: deletedUser,
    });
  } catch (error) {
    // Verifica se é erro de foreign key constraint
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Não é possível deletar este usuário pois ele possui registros relacionados no sistema. Considere desativá-lo ao invés de deletá-lo.' 
      });
    }
    next(error);
  }
};
