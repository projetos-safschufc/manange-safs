import Joi from 'joi';

/**
 * Validador para login
 */
export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  next();
};

/**
 * Validador para cadastro público (register) - sem profile_id obrigatório
 */
export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).trim().required()
      .messages({
        'string.min': 'Nome deve ter no mínimo 3 caracteres',
        'string.max': 'Nome deve ter no máximo 255 caracteres',
        'string.empty': 'Nome é obrigatório',
        'any.required': 'Nome é obrigatório',
      }),
    email: Joi.string().email().trim().lowercase().required()
      .messages({
        'string.email': 'Email inválido',
        'string.empty': 'Email é obrigatório',
        'any.required': 'Email é obrigatório',
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Senha deve ter no mínimo 6 caracteres',
        'string.empty': 'Senha é obrigatória',
        'any.required': 'Senha é obrigatória',
      }),
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Retorna todos os erros, não apenas o primeiro
    stripUnknown: true, // Remove campos não esperados
  });

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: 'Verifique os campos preenchidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Normaliza os dados validados antes de passar para o próximo middleware
  req.body = value;
  next();
};

/**
 * Validador para criar usuário
 */
export const validateCreateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile_id: Joi.number().integer().positive().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  next();
};

/**
 * Validador para atualizar usuário
 */
export const validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    profile_id: Joi.number().integer().positive(),
    status: Joi.string().valid('ativo', 'inativo'),
  }).min(1); // Pelo menos um campo deve ser fornecido

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  next();
};

/**
 * Validador para funcionário
 */
export const validateFuncionario = (req, res, next) => {
  // Normaliza strings vazias para null antes da validação
  const normalizedBody = {};
  Object.keys(req.body).forEach(key => {
    const value = req.body[key];
    if (value === '' || value === null || value === undefined) {
      // Para cargo, permite null; para outros campos obrigatórios, mantém vazio para validação
      if (key === 'cargo') {
        normalizedBody[key] = null;
      } else if (key === 'status') {
        // Status padrão é 'ativo' se não fornecido
        normalizedBody[key] = 'ativo';
      } else {
        normalizedBody[key] = value;
      }
    } else {
      normalizedBody[key] = typeof value === 'string' ? value.trim() : value;
    }
  });

  const schema = Joi.object({
    nome_func: Joi.string().min(3).max(255).required().messages({
      'string.min': 'Nome deve ter no mínimo 3 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome do funcionário é obrigatório',
      'string.empty': 'Nome do funcionário não pode estar vazio',
    }),
    setor_func: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Setor deve ter no mínimo 1 caractere',
      'string.max': 'Setor deve ter no máximo 255 caracteres',
      'any.required': 'Setor é obrigatório',
      'string.empty': 'Setor não pode estar vazio',
    }),
    cargo: Joi.string().max(255).allow(null, '').optional(),
    status: Joi.string().valid('ativo', 'inativo').default('ativo'),
  });

  const { error, value } = schema.validate(normalizedBody, {
    abortEarly: false,
    stripUnknown: true, // Remove campos não conhecidos
  });

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Garante que status tenha valor padrão
  if (!value.status) {
    value.status = 'ativo';
  }

  // Substitui o body normalizado para os próximos middlewares
  req.body = value;
  next();
};

/**
 * Validador para catálogo
 */
export const validateCatalogo = (req, res, next) => {
  // Normaliza strings vazias para null antes da validação (apenas para campos opcionais)
  const normalizedBody = {};
  Object.keys(req.body).forEach(key => {
    const value = req.body[key];
    // Mantém valores válidos, converte strings vazias para null apenas se necessário
    if (value === '' || value === null || value === undefined) {
      normalizedBody[key] = null;
    } else {
      normalizedBody[key] = value;
    }
  });

  // Schema conforme estrutura real da tabela ctrl.safs_catalogo
  const schema = Joi.object({
    master: Joi.string().max(255).allow(null, '').optional(),
    aghu_hu: Joi.string().max(255).allow(null, '').optional(),
    aghu_me: Joi.string().max(255).allow(null, '').optional(),
    catmat: Joi.string().max(255).allow(null, '').optional(),
    ebserh: Joi.string().max(255).allow(null, '').optional(),
    descricao_mat: Joi.string().allow(null, '').optional(),
    apres: Joi.string().max(255).allow(null, '').optional(),
    setor_controle: Joi.string().max(255).allow(null, '').optional(),
    resp_controle: Joi.string().max(255).allow(null, '').optional(),
    serv_aquisicao: Joi.string().max(255).allow(null, '').optional(),
    hosp_demand: Joi.string().max(255).allow(null, '').optional(),
    resp_planj: Joi.string().max(255).allow(null, '').optional(),
    resp_fisc: Joi.string().max(255).allow(null, '').optional(),
    resp_gest_tec: Joi.string().max(255).allow(null, '').optional(),
    gr: Joi.string().max(255).allow(null, '').optional(),
    ativo: Joi.boolean().optional(),
  }).unknown(true); // Permite campos adicionais (serão removidos pelo stripUnknown)

  const { error, value } = schema.validate(normalizedBody, {
    abortEarly: false, // Retorna todos os erros, não apenas o primeiro
    stripUnknown: true, // Remove campos não conhecidos do schema
  });

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Substitui o body normalizado para os próximos middlewares
  req.body = value;
  next();
};

/**
 * Validador para atribuir responsabilidade
 */
export const validateAtribuirResponsabilidade = (req, res, next) => {
  const schema = Joi.object({
    tipo: Joi.string().valid('resp_controle', 'resp_planj', 'resp_fisc', 'resp_gest_tec').required(),
    funcionario_id: Joi.number().integer().positive().required(),
    filtro: Joi.object({
      serv_aquisicao: Joi.string().max(255),
      gr: Joi.string().max(255),
      master: Joi.string().max(255),
    }).min(1).required(), // Pelo menos um filtro deve ser fornecido
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  next();
};
