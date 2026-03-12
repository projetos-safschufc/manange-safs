/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Erro de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Erro do PostgreSQL
  if (err.code) {
    // Erros de violação de restrição (23xxx)
    if (err.code.startsWith('23')) {
      return res.status(400).json({
        error: 'Violação de restrição do banco de dados',
        message: err.message,
      });
    }
    // Erro de coluna não encontrada (42703)
    if (err.code === '42703') {
      return res.status(500).json({
        error: 'Erro na estrutura do banco de dados',
        message: `Coluna não encontrada: ${err.message}`,
        details: 'Verifique se a estrutura da tabela está correta',
      });
    }
    // Erro de tabela não encontrada (42P01)
    if (err.code === '42P01') {
      return res.status(500).json({
        error: 'Erro na estrutura do banco de dados',
        message: `Tabela não encontrada: ${err.message}`,
        details: 'Verifique se a tabela existe no schema correto',
      });
    }
    // Erro de violação de NOT NULL (23502)
    if (err.code === '23502') {
      return res.status(400).json({
        error: 'Campo obrigatório não fornecido',
        message: err.message,
      });
    }
    // Erro de violação de UNIQUE (23505)
    if (err.code === '23505') {
      // Verifica se é violação de email único
      if (err.message && err.message.includes('email')) {
        return res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Este email já está em uso. Tente fazer login ou use outro email.',
        });
      }
      return res.status(400).json({
        error: 'Registro duplicado',
        message: err.message,
      });
    }
  }

  // Erro de autenticação/autorização
  if (err.status === 401 || err.status === 403) {
    return res.status(err.status).json({
      error: err.message || 'Acesso negado',
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Middleware para rotas não encontradas
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.url,
  });
};

