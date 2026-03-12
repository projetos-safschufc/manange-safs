import { query } from '../config/db.js';
import { config } from '../config/env.js';

const schema = config.db.schema;

/**
 * Busca estatísticas do dashboard
 */
export const getDashboardStats = async () => {
  try {
    // Conta total de materiais (considera todos, incluindo inativos)
    const materiaisResult = await query(
      `SELECT COUNT(*) as total 
       FROM ${schema}.safs_catalogo`,
      []
    );
    const totalMateriais = parseInt(materiaisResult.rows[0].total) || 0;

    // Conta total de funcionários (apenas ativos)
    const funcionariosResult = await query(
      `SELECT COUNT(*) as total 
       FROM ${schema}.safs_func 
       WHERE status = 'ativo'`,
      []
    );
    const totalFuncionarios = parseInt(funcionariosResult.rows[0].total) || 0;

    // Conta materiais sem responsável de controle
    // Usa CASE WHEN para contar separadamente vazios e nulos, seguindo exatamente o modelo fornecido
    // Considera materiais onde resp_controle está NULL ou vazio (sem filtro de ativo, como no script original)
    const semResponsavelResult = await query(
      `SELECT 
         COUNT(CASE WHEN resp_controle = '' THEN 1 END) AS vazios,
         COUNT(CASE WHEN resp_controle IS NULL THEN 1 END) AS nulos,
         COUNT(*) AS total_ambos
       FROM ${schema}.safs_catalogo
       WHERE resp_controle = '' OR resp_controle IS NULL`,
      []
    );
    const materiaisSemResponsavel = parseInt(semResponsavelResult.rows[0].total_ambos) || 0;

    // Log detalhado para debug usando os dados já retornados pela query principal
    console.log('📊 Estatísticas do Dashboard:', {
      totalMateriais,
      totalFuncionarios,
      materiaisSemResponsavel,
      detalhes: {
        vazios: parseInt(semResponsavelResult.rows[0].vazios) || 0,
        nulos: parseInt(semResponsavelResult.rows[0].nulos) || 0,
        total_ambos: parseInt(semResponsavelResult.rows[0].total_ambos) || 0,
      },
      queryResult: semResponsavelResult.rows[0],
    });

    return {
      totalMateriais,
      totalFuncionarios,
      materiaisSemResponsavel,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    throw error;
  }
};

