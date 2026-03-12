/**
 * Utilitários para manipulação de filtros
 */

export interface FilterValues {
  [key: string]: string;
}

/**
 * Limpa valores vazios dos filtros
 */
export const cleanFilters = (filters: FilterValues): FilterValues => {
  const cleaned: FilterValues = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.trim() !== '') {
      cleaned[key] = value.trim();
    }
  });
  return cleaned;
};

/**
 * Verifica se há filtros ativos
 */
export const hasActiveFilters = (filters: FilterValues): boolean => {
  return Object.values(filters).some(value => value && value.trim() !== '');
};

/**
 * Conta quantos filtros estão ativos
 */
export const countActiveFilters = (filters: FilterValues): number => {
  return Object.values(filters).filter(value => value && value.trim() !== '').length;
};

/**
 * Cria objeto de filtros para API
 */
export const buildApiFilters = (filters: FilterValues): Record<string, string> => {
  return cleanFilters(filters);
};

/**
 * Valida filtros antes de enviar
 */
export const validateFilters = (filters: FilterValues): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validações específicas podem ser adicionadas aqui
  if (filters.nome && filters.nome.length < 2 && filters.nome.length > 0) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

