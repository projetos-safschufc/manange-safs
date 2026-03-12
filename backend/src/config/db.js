import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Carrega variáveis de ambiente (tenta múltiplos caminhos)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');

/**
 * Processa valor de variável de ambiente removendo aspas
 */
const processEnvValue = (value) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/**
 * Carrega .env manualmente para tratar senhas com caracteres especiais corretamente
 */
const loadEnvManually = (envPath) => {
  if (!existsSync(envPath)) {
    return { parsed: {}, error: new Error('File not found') };
  }
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    const envVars = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ignora linhas vazias
      if (!trimmedLine) continue;
      
      // Ignora comentários (mas não se estiver dentro de aspas)
      if (trimmedLine.startsWith('#')) continue;
      
      // Processa linha no formato KEY=VALUE
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Processa valor removendo aspas
      value = processEnvValue(value);
      
      // Define no process.env
      process.env[key] = value;
      envVars[key] = value;
    }
    
    return { parsed: envVars, error: null };
  } catch (error) {
    return { parsed: {}, error };
  }
};

// Tenta carregar manualmente primeiro (para tratar senhas corretamente)
let envResult = loadEnvManually(envPath);

// Se falhar, tenta com dotenv padrão
if (envResult.error) {
  envResult = dotenv.config({ path: envPath });
  if (envResult.error) {
    // Última tentativa: dotenv padrão
    dotenv.config();
  }
}

const { Pool } = pg;

// Valida e prepara configuração do banco
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '5433', 10);
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
let dbPassword = process.env.DB_PASSWORD;

// Processa a senha removendo aspas se necessário
if (dbPassword) {
  dbPassword = processEnvValue(dbPassword);
}

// Validação especial: detecta se a senha pode ter sido truncada
if (dbPassword && dbPassword.length > 0) {
  // Se a senha parece estar truncada (termina com caracteres especiais sem #)
  // e o arquivo .env contém # na senha, avisa o usuário
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const passwordLine = envContent.split(/\r?\n/).find(line => 
        line.trim().startsWith('DB_PASSWORD=')
      );
      
      if (passwordLine) {
        const expectedPassword = processEnvValue(
          passwordLine.substring(passwordLine.indexOf('=') + 1).trim()
        );
        
        // Se o arquivo tem # mas a senha carregada não tem, há problema
        if (expectedPassword.includes('#') && !dbPassword.includes('#')) {
          console.warn('⚠️  ATENÇÃO: A senha pode ter sido truncada!');
          console.warn('   O arquivo .env contém "#" mas a senha carregada não.');
          console.warn('   Use aspas no arquivo .env: DB_PASSWORD=\'abi123!@#qwe\'');
        }
      }
    } catch (err) {
      // Ignora erros de leitura
    }
  }
}

// Validação de variáveis obrigatórias
if (!dbHost || !dbName || !dbUser || !dbPassword) {
  console.error('❌ Erro: Variáveis de ambiente do banco de dados não configuradas!');
  console.error('   Verifique se o arquivo .env existe em:', envPath);
  console.error('   Variáveis necessárias: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  console.error('\n   Valores encontrados:');
  console.error(`   - DB_HOST: ${dbHost || 'NÃO DEFINIDO'}`);
  console.error(`   - DB_PORT: ${dbPort}`);
  console.error(`   - DB_NAME: ${dbName || 'NÃO DEFINIDO'}`);
  console.error(`   - DB_USER: ${dbUser || 'NÃO DEFINIDO'}`);
  console.error(`   - DB_PASSWORD: ${dbPassword ? '***' : 'NÃO DEFINIDO'}`);
  throw new Error('Configuração do banco de dados incompleta');
}

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentado para dar mais tempo
  ssl: false, // Desabilita SSL por padrão (pode ser configurado via env se necessário)
  // Configuração para garantir UTF-8
  client_encoding: 'UTF8',
});

// Teste de conexão ao inicializar
pool.on('connect', (client) => {
  console.log('✅ Nova conexão estabelecida com o banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err.message);
  console.error('   Código:', err.code);
  console.error('   Detalhes:', err.detail || 'N/A');
  // Não encerra o processo imediatamente, permite retry
});

// Função helper para executar queries com tratamento de erros
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executada', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalhes:', error.detail || 'N/A');
    console.error('   Query:', text.substring(0, 200));
    
    // Mensagens de erro mais amigáveis
    if (error.code === '28P01') {
      throw new Error('Falha na autenticação: usuário ou senha incorretos');
    } else if (error.code === '3D000') {
      throw new Error(`Banco de dados "${dbName}" não existe`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Não foi possível conectar ao servidor ${dbHost}:${dbPort}. Verifique se o servidor está rodando.`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`Host "${dbHost}" não encontrado. Verifique o DNS ou o nome do servidor.`);
    }
    
    throw error;
  }
};

// Função helper para transações
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

