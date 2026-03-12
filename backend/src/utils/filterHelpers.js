/**
 * Utilitários para construção de queries com filtros
 */

/**
 * Limpa valores vazios dos filtros
 */
export const cleanFilters = (filters) => {
  const cleaned = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string' && value.trim() !== '') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

/**
 * Constrói cláusula WHERE para filtros de texto (ILIKE)
 */
export const buildTextFilter = (field, value, paramIndex) => {
  if (!value) return { clause: '', param: null, nextIndex: paramIndex };
  
  return {
    clause: ` AND ${field} ILIKE $${paramIndex}`,
    param: `%${value}%`,
    nextIndex: paramIndex + 1,
  };
};

/**
 * Constrói cláusula WHERE para filtros de igualdade exata
 */
export const buildExactFilter = (field, value, paramIndex) => {
  if (!value) return { clause: '', param: null, nextIndex: paramIndex };
  
  return {
    clause: ` AND ${field} = $${paramIndex}`,
    param: value,
    nextIndex: paramIndex + 1,
  };
};

/**
 * Constrói cláusula WHERE completa a partir de filtros
 */
export const buildWhereClause = (filters, fieldMappings) => {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  const cleanedFilters = cleanFilters(filters);

  Object.entries(cleanedFilters).forEach(([key, value]) => {
    const mapping = fieldMappings[key];
    if (!mapping) return;

    let result;
    if (mapping.type === 'text') {
      result = buildTextFilter(mapping.field, value, paramIndex);
    } else if (mapping.type === 'exact') {
      result = buildExactFilter(mapping.field, value, paramIndex);
    } else {
      return; // Tipo não suportado
    }

    if (result.clause) {
      whereClause += result.clause;
      params.push(result.param);
      paramIndex = result.nextIndex;
    }
  });

  return { whereClause, params };
};

/**
 * Valida filtros antes de usar
 */
export const validateFilters = (filters, allowedFields) => {
  const errors = [];
  const cleaned = cleanFilters(filters);

  // Verifica se há campos não permitidos
  Object.keys(cleaned).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`Campo de filtro não permitido: ${key}`);
    }
  });

  // Validações específicas
  if (cleaned.nome && cleaned.nome.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
    cleaned,
  };
};

