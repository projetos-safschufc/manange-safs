import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../config/db.js';

/**
 * Middleware de autenticação JWT
 * Verifica o token JWT e anexa o usuário ao request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verifica o token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Busca o usuário no banco de dados
    let userResult;
    try {
      const { getProfileNameSelect } = await import('../utils/dbSchema.js');
      const profileSelect = await getProfileNameSelect();
      userResult = await query(
        `SELECT u.id, u.name, u.email, u.profile_id, ${profileSelect}
         FROM ${config.db.schema}.users u
         LEFT JOIN ${config.db.schema}.access_profile ap ON u.profile_id = ap.id
         WHERE u.id = $1 AND u.status = 'ativo'`,
        [decoded.userId]
      );
    } catch (error) {
      // Se o JOIN falhar (tabela ou coluna não existe), busca sem JOIN
      if (error.code === '42703' || error.message.includes('does not exist')) {
        userResult = await query(
          `SELECT u.id, u.name, u.email, u.profile_id, NULL as profile_name
           FROM ${config.db.schema}.users u
           WHERE u.id = $1 AND u.status = 'ativo'`,
          [decoded.userId]
        );
      } else {
        throw error;
      }
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado ou inativo' 
      });
    }

    // Anexa o usuário ao request
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
};

/**
 * Middleware para verificar se o usuário tem uma role específica
 * @param {string[]} allowedRoles - Array de nomes de perfis permitidos (ex: ['admin'])
 */
export const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verifica se é ADMIN por profile_id = 1 (método mais confiável)
    const isAdmin = req.user.profile_id === 1;
    
    // Se for ADMIN, sempre tem acesso
    if (isAdmin && allowedRoles.includes('admin')) {
      return next();
    }

    // Se não for ADMIN e precisa ser ADMIN, nega acesso
    if (allowedRoles.includes('admin') && !isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
      });
    }

    // Tenta verificar por permissões (se a tabela existir)
    try {
      const permissionsResult = await query(
        `SELECT pp.permission_name 
         FROM ${config.db.schema}.profile_permission pp
         WHERE pp.profile_id = $1`,
        [req.user.profile_id]
      );

      const userPermissions = permissionsResult.rows.map(p => p.permission_name);
      const userProfile = req.user.profile_name || null;

      // Verifica se o perfil ou permissões estão nas roles permitidas
      const hasAccess = (userProfile && allowedRoles.includes(userProfile)) || 
                        allowedRoles.some(role => userPermissions.includes(role));

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado. Permissões insuficientes.' 
        });
      }
    } catch (error) {
      // Se a tabela de permissões não existir, verifica apenas por profile_id
      // Se não for ADMIN e precisa ser ADMIN, nega acesso
      if (allowedRoles.includes('admin') && !isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
        });
      }
      
      // Se não há verificação de permissões e não é ADMIN, nega acesso
      if (allowedRoles.length > 0 && !isAdmin) {
        return res.status(403).json({ 
          error: 'Acesso negado. Permissões insuficientes.' 
        });
      }
    }

    next();
  };
};

/**
 * Middleware helper para verificar se é ADMIN
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  if (req.user.profile_id !== 1) {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
    });
  }
  
  next();
};

