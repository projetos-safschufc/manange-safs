import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para login (mais restritivo)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter geral para API
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requisições por IP (aumentado para evitar 429 em carregamento de filtros)
  message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter mais permissivo para endpoints de filtros/opções
 */
export const filterLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // máximo 50 requisições por minuto para filtros
  message: 'Muitas requisições de filtros. Aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
});

