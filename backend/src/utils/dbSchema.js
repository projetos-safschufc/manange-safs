import { query } from '../config/db.js';
import { config } from '../config/env.js';

const schema = config.db.schema;

/**
 * Descobre o nome real da coluna de nome do perfil na tabela access_profile
 */
let profileNameColumn = null;
let discoveryAttempted = false;

export const getProfileNameColumn = async () => {
  // Se já descobrimos, retorna o valor em cache
  if (profileNameColumn) {
    return profileNameColumn;
  }

  // Se já tentamos e não encontramos, retorna null para evitar múltiplas tentativas
  if (discoveryAttempted) {
    return null;
  }

  discoveryAttempted = true;

  try {
    // Primeiro tenta descobrir via information_schema
    try {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = $1 
         AND table_name = 'access_profile'
         AND column_name IN ('profile_name', 'name', 'nome', 'profile', 'profile_nome', 'nome_perfil')`,
        [schema]
      );

      if (result.rows.length > 0) {
        profileNameColumn = result.rows[0].column_name;
        console.log(`✅ Coluna de perfil descoberta: ${profileNameColumn}`);
        return profileNameColumn;
      }
    } catch (schemaError) {
      // Se information_schema falhar, tenta método alternativo
      console.warn('⚠️  Não foi possível consultar information_schema, tentando método alternativo...');
    }

    // Método alternativo: consulta a tabela diretamente
    try {
      const testResult = await query(
        `SELECT * FROM ${schema}.access_profile LIMIT 1`,
        []
      );

      if (testResult.rows.length > 0) {
        const columns = Object.keys(testResult.rows[0]);
        // Procura por colunas que podem ser o nome do perfil
        const possibleColumns = columns.filter(col => 
          col.toLowerCase().includes('name') || 
          col.toLowerCase().includes('nome') ||
          (col.toLowerCase().includes('profile') && !col.toLowerCase().includes('id'))
        );

        if (possibleColumns.length > 0) {
          profileNameColumn = possibleColumns[0];
          console.log(`✅ Coluna de perfil descoberta via consulta direta: ${profileNameColumn}`);
          return profileNameColumn;
        }
      }
    } catch (queryError) {
      console.warn('⚠️  Não foi possível consultar a tabela diretamente:', queryError.message);
    }

    // Se não encontrou, retorna null
    console.warn('⚠️  Não foi possível descobrir a coluna de nome do perfil. Usando fallback.');
    return null;
  } catch (error) {
    console.warn('⚠️  Erro ao descobrir estrutura da tabela access_profile:', error.message);
    return null;
  }
};

/**
 * Retorna o nome da coluna ou um alias padrão
 */
export const getProfileNameSelect = async () => {
  const column = await getProfileNameColumn();
  if (column) {
    return `ap.${column} as profile_name`;
  }
  return 'NULL as profile_name';
};

