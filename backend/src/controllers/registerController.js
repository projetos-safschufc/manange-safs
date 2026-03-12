import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel.js';

/**
 * Controller para cadastro público de novos usuários
 * Atribui automaticamente o perfil ID 3
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Normaliza os dados
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validações adicionais
    if (normalizedName.length < 3) {
      return res.status(400).json({ 
        error: 'Nome deve ter no mínimo 3 caracteres' 
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ 
        error: 'Email inválido' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 6 caracteres' 
      });
    }

    // Verifica se o email já existe
    const existingUser = await userModel.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        message: 'Este email já está em uso. Tente fazer login ou use outro email.'
      });
    }

    // Valida se o perfil 3 existe
    let finalProfileId = 3;
    try {
      const { query } = await import('../config/db.js');
      const { config } = await import('../config/env.js');
      const profileCheck = await query(
        `SELECT id FROM ${config.db.schema}.access_profile WHERE id = $1`,
        [finalProfileId]
      );
      
      if (profileCheck.rows.length === 0) {
        console.warn(`⚠️  Perfil ID ${finalProfileId} não encontrado. Tentando usar perfil disponível...`);
        // Tenta encontrar qualquer perfil disponível
        const anyProfile = await query(
          `SELECT id FROM ${config.db.schema}.access_profile LIMIT 1`,
          []
        );
        if (anyProfile.rows.length > 0) {
          finalProfileId = anyProfile.rows[0].id;
          console.log(`✅ Usando perfil ID ${finalProfileId} como padrão`);
        } else {
          return res.status(500).json({ 
            error: 'Nenhum perfil de acesso disponível no sistema' 
          });
        }
      }
    } catch (error) {
      // Se houver erro ao verificar, continua com perfil 3
      console.warn('⚠️  Não foi possível validar o perfil, usando perfil 3 por padrão');
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Cria o usuário com perfil 3
    const user = await userModel.createUser({
      name: normalizedName,
      email: normalizedEmail,
      password_hash,
      profile_id: finalProfileId,
    });

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso! Você pode fazer login agora.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_id: user.profile_id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Tratamento específico de erros do PostgreSQL
    if (error.code === '23505') {
      // Violação de UNIQUE (email duplicado)
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Este email já está em uso. Tente fazer login ou use outro email.',
      });
    }

    if (error.code === '23502') {
      // Violação de NOT NULL
      return res.status(400).json({
        error: 'Campo obrigatório não fornecido',
        message: error.message,
      });
    }

    // Outros erros
    next(error);
  }
};

