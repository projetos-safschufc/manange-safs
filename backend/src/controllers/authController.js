import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserByEmail } from '../models/userModel.js';

/**
 * Controller de login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Busca o usuário
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    // Verifica se o hash é bcrypt (começa com $2)
    const isBcryptHash = user.password_hash && user.password_hash.startsWith('$2');
    
    if (!isBcryptHash) {
      console.error(`⚠️  Usuário ${user.email} (ID: ${user.id}) possui hash inválido (não é bcrypt)`);
      console.error(`   Hash atual: ${user.password_hash.substring(0, 30)}...`);
      return res.status(401).json({ 
        error: 'Senha inválida. Entre em contato com o administrador para redefinir sua senha.' 
      });
    }

    // Verifica a senha
    let passwordMatch;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Erro ao comparar senha:', error);
      return res.status(500).json({ 
        error: 'Erro ao verificar credenciais' 
      });
    }

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    // Verifica se o usuário está ativo
    if (user.status !== 'ativo') {
      return res.status(401).json({ 
        error: 'Usuário inativo' 
      });
    }

    // Gera tokens JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Retorna os dados do usuário (sem senha) e tokens
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_id: user.profile_id,
        profile_name: user.profile_name,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para refresh token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token não fornecido' 
      });
    }

    // Verifica o refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Busca o usuário por ID
    const { findUserById } = await import('../models/userModel.js');
    const user = await findUserById(decoded.userId);

    if (!user || user.status !== 'ativo') {
      return res.status(401).json({ 
        error: 'Usuário inválido ou inativo' 
      });
    }

    // Gera novo token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }
    next(error);
  }
};

