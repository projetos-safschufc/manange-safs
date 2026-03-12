import { query, transaction } from '../config/db.js';
import { config } from '../config/env.js';
import { buildWhereClause, cleanFilters } from '../utils/filterHelpers.js';

const schema = config.db.schema;

/**
 * Normaliza strings UTF-8 para garantir caracteres corretos em português
 * Converte caracteres mal codificados (ISO-8859-1 interpretado como UTF-8) para UTF-8 correto
 * Baseado na relação completa de correções comuns para português (dupla codificação)
 */
const normalizeUtf8 = (str) => {
  if (!str || typeof str !== 'string') return str;
  try {
    // Remove BOM se presente
    let normalized = str.replace(/^\uFEFF/, '');
    
    // Decodifica entidades HTML se houver
    normalized = normalized.replace(/&nbsp;/g, ' ');
    normalized = normalized.replace(/&amp;/g, '&');
    normalized = normalized.replace(/&lt;/g, '<');
    normalized = normalized.replace(/&gt;/g, '>');
    normalized = normalized.replace(/&quot;/g, '"');
    normalized = normalized.replace(/&#39;/g, "'");
    normalized = normalized.replace(/&apos;/g, "'");
    
    // ============================================
    // ETAPA 1: SEQUÊNCIAS COMPLEXAS (PRIMEIRO!)
    // ============================================
    // IMPORTANTE: Processar sequências ANTES de caracteres individuais
    normalized = normalized.replace(/Ã§Ã£o/g, 'ção'); // ção
    normalized = normalized.replace(/Ã§Ãµes/g, 'ções'); // ções
    normalized = normalized.replace(/Ã§Ã£/g, 'çã'); // çã
    normalized = normalized.replace(/Ã§Ãµ/g, 'çõ'); // çõ
    normalized = normalized.replace(/Ã£o/g, 'ão'); // ão
    
    // ============================================
    // ETAPA 2: SÍMBOLOS ESPECIAIS (Windows-1252)
    // ============================================
    normalized = normalized.replace(/â‚¬/g, '€'); // Euro
    normalized = normalized.replace(/â€š/g, ','); // vírgula baixa
    normalized = normalized.replace(/â€œ/g, '"'); // aspas curvas duplas abertas
    normalized = normalized.replace(/â€/g, '"'); // aspas curvas duplas fechadas
    normalized = normalized.replace(/â€¢/g, '•'); // ponto lista
    normalized = normalized.replace(/â€"/g, '–'); // travessão
    normalized = normalized.replace(/â€"/g, '—'); // travessão longo
    
    // ============================================
    // ETAPA 3: CARACTERES MINÚSCULOS COM ACENTO AGUDO
    // ============================================
    normalized = normalized.replace(/Ã¡/g, 'á'); // a agudo
    normalized = normalized.replace(/Ã©/g, 'é'); // e agudo
    normalized = normalized.replace(/Ã­/g, 'í'); // i agudo
    normalized = normalized.replace(/Ã³/g, 'ó'); // o agudo
    // NOTA: Ãº pode ser ú ou º - processar depois com contexto
    
    // ============================================
    // ETAPA 4: CARACTERES COM ACENTO CIRCUNFLEXO
    // ============================================
    normalized = normalized.replace(/Ã¢/g, 'â'); // a circunflexo
    // NOTA: Ãª pode ser ê ou ª - processar depois com contexto
    normalized = normalized.replace(/Ã´/g, 'ô'); // o circunflexo
    
    // ============================================
    // ETAPA 5: CARACTERES COM TIL
    // ============================================
    normalized = normalized.replace(/Ã£/g, 'ã'); // a til
    normalized = normalized.replace(/Ãµ/g, 'õ'); // o til
    normalized = normalized.replace(/Ãƒ/g, 'Ã'); // A til
    normalized = normalized.replace(/Ã•/g, 'Õ'); // O til
    
    // ============================================
    // ETAPA 6: CARACTERES COM CEDILHA
    // ============================================
    normalized = normalized.replace(/Ã§/g, 'ç'); // c cedilha minúsculo
    normalized = normalized.replace(/Ã‡/g, 'Ç'); // C cedilha maiúsculo
    
    // ============================================
    // ETAPA 7: CARACTERES MAIÚSCULOS COM ACENTO AGUDO
    // ============================================
    normalized = normalized.replace(/Ã€/g, 'À'); // A grave/agudo
    normalized = normalized.replace(/Ã‰/g, 'É'); // E agudo
    normalized = normalized.replace(/Ã/g, 'Í'); // I agudo
    normalized = normalized.replace(/Ã"/g, 'Ó'); // O agudo
    normalized = normalized.replace(/Ãš/g, 'Ú'); // U agudo
    
    // ============================================
    // ETAPA 8: CARACTERES COM ACENTO CIRCUNFLEXO MAIÚSCULOS
    // ============================================
    normalized = normalized.replace(/Ã‚/g, 'Â'); // A circunflexo
    normalized = normalized.replace(/ÃŠ/g, 'Ê'); // E circunflexo
    normalized = normalized.replace(/Ã"/g, 'Ô'); // O circunflexo
    
    // ============================================
    // ETAPA 9: CARACTERES AMBÍGUOS (com contexto)
    // ============================================
    // Ãº pode ser ú (acento) ou º (ordinal)
    // Se seguido de espaço, número ou no final, provavelmente é ordinal
    normalized = normalized.replace(/Ãº(?=\s|$|\d)/g, 'º'); // ordinal masculino
    normalized = normalized.replace(/Ãº/g, 'ú'); // u agudo (restante)
    
    // Ãª pode ser ê (acento) ou ª (ordinal)
    normalized = normalized.replace(/Ãª(?=\s|$|\d)/g, 'ª'); // ordinal feminino
    normalized = normalized.replace(/Ãª/g, 'ê'); // e circunflexo (restante)
    
    // ============================================
    // ETAPA 10: OUTROS CARACTERES ESPECIAIS
    // ============================================
    normalized = normalized.replace(/Ã°/g, '°'); // grau
    normalized = normalized.replace(/Ã±/g, 'ñ'); // n til
    normalized = normalized.replace(/Ã¼/g, 'ü'); // u trema
    normalized = normalized.replace(/Ã /g, 'à'); // a grave (com espaço invisível)
    
    // ============================================
    // ETAPA 11: CONVERSÃO FINAL COM BUFFER
    // ============================================
    // Se ainda houver caracteres mal codificados, tenta conversão direta
    if (normalized.includes('Ã') || normalized.includes('â€')) {
      try {
        // Tenta converter de ISO-8859-1 (Latin-1) para UTF-8
        const buffer = Buffer.from(normalized, 'latin1');
        const converted = buffer.toString('utf8');
        
        // Se a conversão resultou em menos caracteres mal codificados, usa ela
        const originalBadChars = (normalized.match(/Ã/g) || []).length;
        const convertedBadChars = (converted.match(/Ã/g) || []).length;
        
        if (convertedBadChars < originalBadChars || !converted.includes('Ã')) {
          normalized = converted;
          // Reaplica algumas correções que podem ter sido perdidas na conversão
          normalized = normalized.replace(/Ã§Ã£o/g, 'ção');
          normalized = normalized.replace(/Ã§Ãµes/g, 'ções');
          normalized = normalized.replace(/Ã£o/g, 'ão');
        }
      } catch (e) {
        // Se falhar, mantém o valor após as substituições manuais
        console.warn('Não foi possível converter string completamente:', e.message);
      }
    }
    
    // Limpeza final: remove caracteres de controle invisíveis comuns
    normalized = normalized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    return normalized;
  } catch (error) {
    console.warn('Erro ao normalizar UTF-8:', error);
    return str;
  }
};

/**
 * Cria uma nova entrada no catálogo
 * Conforme estrutura real da tabela ctrl.safs_catalogo
 */
export const createCatalogo = async (catalogoData) => {
  const allowedFields = [
    'master',
    'aghu_hu',
    'aghu_me',
    'catmat',
    'ebserh',
    'descricao_mat',
    'apres',
    'setor_controle',
    'resp_controle',
    'serv_aquisicao',
    'hosp_demand',
    'resp_planj',
    'resp_fisc',
    'resp_gest_tec',
    'gr',
    'ativo',
  ];

  const fields = [];
  const values = [];
  let paramIndex = 1;

  allowedFields.forEach((field) => {
    if (catalogoData[field] !== undefined) {
      fields.push(field);
      let value = catalogoData[field];
      if (value === '') {
        value = null;
      }
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    throw new Error('Nenhum campo fornecido para criação');
  }

  const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

  const result = await query(
    `INSERT INTO ${schema}.safs_catalogo (${fields.join(', ')}, last_updated_at)
    VALUES (${placeholders}, NOW())
    RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Lista itens do catálogo com filtros e paginação
 */
export const listCatalogo = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  
  // Limpa e valida filtros
  const allowedFields = ['master', 'descricao_mat', 'serv_aquisicao', 'gr', 'resp_controle'];
  const cleanedFilters = cleanFilters(filters);
  
  // Remove campos não permitidos silenciosamente
  const validFilters = {};
  Object.entries(cleanedFilters).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      validFilters[key] = value;
    }
  });

  // Mapeamento de campos para construção da query
  const fieldMappings = {
    master: { field: 'master', type: 'text' },
    descricao_mat: { field: 'descricao_mat', type: 'text' },
    serv_aquisicao: { field: 'serv_aquisicao', type: 'exact' },
    gr: { field: 'gr', type: 'exact' },
    resp_controle: { field: 'resp_controle', type: 'text' },
  };

  // Constrói cláusula WHERE
  const { whereClause, params } = buildWhereClause(validFilters, fieldMappings);

  // Busca total de registros
  const countResult = await query(
    `SELECT COUNT(*) as total 
     FROM ${schema}.safs_catalogo ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  // Busca os registros com paginação
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  const result = await query(
    `SELECT * 
     FROM ${schema}.safs_catalogo
     ${whereClause}
     ORDER BY master ASC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    [...params, limit, offset]
  );


  // Normaliza os dados retornados - aplica UTF-8 em todos os campos de texto
  const catalogoNormalizado = result.rows.map(row => {
    const normalizedRow = { ...row };
    
    // Lista de campos de texto que podem ter problemas de codificação (conforme estrutura real da tabela)
    const textFields = [
      'descricao_mat',
      'resp_controle',
      'resp_planj',
      'resp_fisc',
      'resp_gest_tec',
      'serv_aquisicao',
      'setor_controle',
      'hosp_demand',
      'apres',
      'aghu_hu',
      'aghu_me',
      'catmat',
      'ebserh',
    ];
    
    // Normaliza todos os campos de texto
    textFields.forEach(field => {
      if (normalizedRow[field] && typeof normalizedRow[field] === 'string') {
        normalizedRow[field] = normalizeUtf8(normalizedRow[field]);
      }
    });
    
    return normalizedRow;
  });

  return {
    catalogo: catalogoNormalizado,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Busca um item do catálogo por ID
 */
export const findCatalogoById = async (id) => {
  const result = await query(
    `SELECT * FROM ${schema}.safs_catalogo WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  // Lista de campos de texto que podem ter problemas de codificação
  const textFields = [
    'descricao_mat',
    'resp_controle',
    'resp_planj',
    'resp_almox',
    'resp_compra',
    'resp_fisc',
    'resp_gest_tec',
    'serv_aquisicao',
    'setor_controle',
    'setor_planj',
    'setor_almox',
    'setor_compra',
    'hosp_demand',
    'apres',
  ];
  
  // Normaliza todos os campos de texto
  textFields.forEach(field => {
    if (row[field] && typeof row[field] === 'string') {
      row[field] = normalizeUtf8(row[field]);
    }
  });
  
  return row;
};

/**
 * Atualiza um item do catálogo
 */
export const updateCatalogo = async (id, catalogoData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Campos permitidos conforme estrutura real da tabela ctrl.safs_catalogo
  const allowedFields = [
    'master',
    'aghu_hu',
    'aghu_me',
    'catmat',
    'ebserh',
    'descricao_mat',
    'apres',
    'setor_controle',
    'resp_controle',
    'serv_aquisicao',
    'hosp_demand',
    'resp_planj',
    'resp_fisc',
    'resp_gest_tec',
    'gr',
    'ativo',
  ];

  allowedFields.forEach((field) => {
    if (catalogoData[field] !== undefined) {
      // Converte strings vazias para null, mantém outros valores
      let value = catalogoData[field];
      if (value === '') {
        value = null;
      }
      fields.push(`${field} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }

  values.push(id);
  const result = await query(
    `UPDATE ${schema}.safs_catalogo 
     SET ${fields.join(', ')}, last_updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Atribui responsabilidade a múltiplos materiais atomicamente
 * @param {Object} params - { tipo, funcionario_id, filtro: { serv_aquisicao?, gr?, master? } }
 */
export const atribuirResponsabilidade = async (params) => {
  const { tipo, funcionario_id, filtro } = params;

  // Tipos válidos de responsabilidade (conforme estrutura real da tabela)
  const tiposValidos = ['resp_controle', 'resp_planj', 'resp_fisc', 'resp_gest_tec'];
  if (!tiposValidos.includes(tipo)) {
    throw new Error(`Tipo de responsabilidade inválido: ${tipo}`);
  }

  // Busca dados do funcionário
  const funcionarioResult = await query(
    `SELECT nome_func, setor_func FROM ${schema}.safs_func WHERE id_func = $1`,
    [funcionario_id]
  );

  if (funcionarioResult.rows.length === 0) {
    throw new Error('Funcionário não encontrado');
  }

  const { nome_func, setor_func } = funcionarioResult.rows[0];

  // Determina o campo de setor correspondente
  // Apenas resp_controle tem setor correspondente (setor_controle)
  // Os outros campos de responsabilidade não têm setor correspondente na tabela
  const setorField = tipo === 'resp_controle' ? 'setor_controle' : null;

  // Constrói a cláusula WHERE baseada nos filtros
  let whereClause = 'WHERE 1=1';
  const updateParams = [];
  let paramIndex = 1;

  if (filtro.serv_aquisicao) {
    whereClause += ` AND serv_aquisicao = $${paramIndex++}`;
    updateParams.push(filtro.serv_aquisicao);
  }

  if (filtro.gr) {
    whereClause += ` AND gr = $${paramIndex++}`;
    updateParams.push(filtro.gr);
  }

  if (filtro.master) {
    whereClause += ` AND master ILIKE $${paramIndex++}`;
    updateParams.push(`%${filtro.master}%`);
  }

  // Executa a atualização em transação
  return await transaction(async (client) => {
    // Atualiza safs_catalogo
    // Apenas resp_controle tem setor correspondente (setor_controle)
    let updateQuery;
    if (setorField) {
      // Para resp_controle, atualiza também o setor
      updateQuery = `
        UPDATE ${schema}.safs_catalogo 
        SET ${tipo} = $${paramIndex++}, 
            ${setorField} = $${paramIndex++},
            last_updated_at = NOW()
        ${whereClause}
        RETURNING id, master, descricao_mat
      `;
      updateParams.push(nome_func, setor_func);
    } else {
      // Para outros tipos de responsabilidade, atualiza apenas o responsável
      updateQuery = `
        UPDATE ${schema}.safs_catalogo 
        SET ${tipo} = $${paramIndex++},
            last_updated_at = NOW()
        ${whereClause}
        RETURNING id, master, descricao_mat
      `;
      updateParams.push(nome_func);
    }

    const catalogoResult = await client.query(updateQuery, updateParams);
    const affectedRows = catalogoResult.rows.length;

    // Se o tipo for resp_controle e houver filtro por gr, atualiza também safs_gr_materiais
    if (tipo === 'resp_controle' && filtro.gr) {
      await client.query(
        `UPDATE ${schema}.safs_gr_materiais 
         SET resp_controlador = $1, updated_at = NOW()
         WHERE gr = $2`,
        [nome_func, filtro.gr]
      );
    }

    return {
      affectedRows,
      materiais: catalogoResult.rows,
    };
  });
};

/**
 * Deleta um item do catálogo
 */
export const deleteCatalogo = async (id) => {
  const result = await query(
    `DELETE FROM ${schema}.safs_catalogo WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0];
};

/**
 * Atualiza múltiplos itens do catálogo por IDs
 * @param {Array<number>} ids - Array de IDs dos itens a atualizar
 * @param {Object} updateData - Dados para atualizar (ex: { resp_controle: 'Nome', setor_controle: 'Setor' })
 */
export const updateMultipleCatalogo = async (ids, updateData) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error('IDs devem ser um array não vazio');
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'master', 'aghu_hu', 'aghu_me', 'catmat', 'ebserh', 'descricao_mat', 'apres',
    'setor_controle', 'resp_controle', 'serv_aquisicao', 'hosp_demand', 'resp_planj',
    'resp_fisc', 'resp_gest_tec', 'gr', 'ativo'
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      let value = updateData[field];
      if (value === '') {
        value = null;
      }
      fields.push(`${field} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }

  // Adiciona last_updated_at
  fields.push(`last_updated_at = NOW()`);

  // Adiciona os IDs como parâmetros
  const idPlaceholders = ids.map((_, index) => `$${paramIndex + index}`).join(', ');
  values.push(...ids);

  const result = await query(
    `UPDATE ${schema}.safs_catalogo 
     SET ${fields.join(', ')}
     WHERE id IN (${idPlaceholders})
     RETURNING id, master, descricao_mat, resp_controle, setor_controle`,
    values
  );

  return {
    affectedRows: result.rows.length,
    updatedItems: result.rows,
  };
};

/**
 * Busca grupos de materiais
 */
export const listGruposMateriais = async () => {
  const result = await query(
    `SELECT gr, descricao_gr, resp_controlador 
     FROM ${schema}.safs_gr_materiais
     ORDER BY gr`,
    []
  );
  return result.rows;
};

/**
 * Busca serviços de aquisição únicos
 */
export const listServicosAquisicao = async () => {
  try {
    const result = await query(
      `SELECT DISTINCT serv_aquisicao 
       FROM ${schema}.safs_catalogo
       WHERE serv_aquisicao IS NOT NULL 
         AND serv_aquisicao != ''
         AND TRIM(serv_aquisicao) != ''
       ORDER BY serv_aquisicao ASC`,
      []
    );
    
    const servicos = result.rows
      .map(row => {
        const serv = row.serv_aquisicao;
        return serv ? String(serv).trim() : null;
      })
      .filter(serv => serv && serv !== '')
      .sort();
    
    return servicos;
  } catch (error) {
    console.error('❌ Erro ao buscar serviços de aquisição:', error);
    throw error;
  }
};

/**
 * Busca valores únicos de GR da tabela safs_catalogo
 */
export const listGruposCatalogo = async () => {
  try {
    const result = await query(
      `SELECT DISTINCT gr 
       FROM ${schema}.safs_catalogo
       WHERE gr IS NOT NULL 
         AND gr != ''
         AND TRIM(gr) != ''
       ORDER BY gr ASC`,
      []
    );
    
    const grupos = result.rows
      .map(row => {
        const gr = row.gr;
        return gr ? String(gr).trim() : null;
      })
      .filter(gr => gr && gr !== '')
      .sort();
    
    return grupos;
  } catch (error) {
    console.error('❌ Erro ao buscar grupos do catálogo:', error);
    throw error;
  }
};

