import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente (tenta múltiplos caminhos)
const envPath = join(__dirname, '../.env');

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
  console.warn('⚠️  Arquivo .env não encontrado em:', envPath);
  console.warn('   Tentando carregar do diretório padrão...');
  envResult = dotenv.config({ path: envPath });
  if (envResult.error) {
    const defaultResult = dotenv.config();
    if (defaultResult.error) {
      console.error('❌ Não foi possível carregar variáveis de ambiente!');
    }
  }
}

// Valida variáveis de ambiente
let dbPassword = process.env.DB_PASSWORD;
if (dbPassword) {
  dbPassword = processEnvValue(dbPassword);
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword,
};

// Validação especial: detecta se a senha pode ter sido truncada
if (dbConfig.password && existsSync(envPath)) {
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
      if (expectedPassword.includes('#') && !dbConfig.password.includes('#')) {
        console.error('❌ ERRO CRÍTICO: A senha foi truncada!');
        console.error('   O arquivo .env contém "#" mas a senha carregada não.');
        console.error('   Solução: Use aspas no arquivo .env:');
        console.error('   DB_PASSWORD=\'abi123!@#qwe\'');
        console.error('');
        console.error('   Senha esperada (com #):', expectedPassword.replace(/./g, '*'));
        console.error('   Senha carregada:', dbConfig.password.replace(/./g, '*'));
        process.exit(1);
      }
    }
  } catch (err) {
    // Ignora erros de leitura
  }
}

// Verifica se as variáveis foram carregadas
if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('   Verifique se o arquivo .env existe em:', envPath);
  console.error('   Variáveis necessárias:');
  console.error('   - DB_HOST');
  console.error('   - DB_PORT');
  console.error('   - DB_NAME');
  console.error('   - DB_USER');
  console.error('   - DB_PASSWORD');
  console.error('\n   Valores encontrados:');
  console.error('   - DB_HOST:', dbConfig.host || 'NÃO DEFINIDO');
  console.error('   - DB_PORT:', dbConfig.port);
  console.error('   - DB_NAME:', dbConfig.database || 'NÃO DEFINIDO');
  console.error('   - DB_USER:', dbConfig.user || 'NÃO DEFINIDO');
  console.error('   - DB_PASSWORD:', dbConfig.password ? '***' : 'NÃO DEFINIDO');
  process.exit(1);
}

console.log('📋 Configuração do banco de dados:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log('');

const { Pool } = pg;

// Cria pool de conexões para o script
const pool = new Pool({
  ...dbConfig,
  max: 1, // Apenas uma conexão para o script
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Aumentado para dar mais tempo
  ssl: false, // Desabilita SSL por padrão
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões:', err.message);
  console.error('   Código:', err.code);
});

// Função helper para executar queries
const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res;
};

/**
 * Script para criar usuário ADMIN inicial
 * Uso: node scripts/createAdminUser.js
 */
async function createAdminUser() {
  try {
    console.log('🔧 Iniciando criação do usuário ADMIN...');
    console.log('');

    // Testa conexão primeiro
    console.log('🔌 Testando conexão com o banco de dados...');
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Conexão estabelecida com sucesso!\n');
    } catch (connError) {
      console.error('❌ Erro ao conectar ao banco de dados:');
      console.error('   Mensagem:', connError.message);
      console.error('   Código:', connError.code);
      if (connError.code === '28P01') {
        console.error('\n💡 Dica: Verifique se o usuário e senha estão corretos no arquivo .env');
        console.error('   A senha pode conter caracteres especiais que precisam ser escapados.');
      } else if (connError.code === 'ECONNREFUSED') {
        console.error(`\n💡 Dica: Não foi possível conectar a ${dbConfig.host}:${dbConfig.port}`);
        console.error('   Verifique se o servidor PostgreSQL está rodando e acessível.');
      }
      throw connError;
    }

    const name = 'IVALNEI';
    const email = 'ivalnei@gmail.com';
    const password = 'oriximina';
    const schema = process.env.DB_SCHEMA || 'ctrl';

    console.log('📋 Verificando se o usuário já existe...');
    // Verifica se já existe um usuário com este email
    const existingUser = await query(
      `SELECT id FROM ${schema}.users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Usuário com este email já existe!');
      return;
    }

    // Descobre o nome da coluna de perfil
    console.log('🔍 Descobrindo estrutura da tabela access_profile...');
    let profileColumn = 'name'; // fallback padrão
    try {
      const columnResult = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = $1 
         AND table_name = 'access_profile'
         AND column_name IN ('profile_name', 'name', 'nome', 'profile')`,
        [schema]
      );
      
      if (columnResult.rows.length > 0) {
        profileColumn = columnResult.rows[0].column_name;
        console.log(`✅ Coluna encontrada: ${profileColumn}`);
      } else {
        // Tenta descobrir consultando a tabela diretamente
        const testResult = await query(`SELECT * FROM ${schema}.access_profile LIMIT 1`, []);
        if (testResult.rows.length > 0) {
          const columns = Object.keys(testResult.rows[0]);
          const possibleCol = columns.find(col => 
            col.toLowerCase().includes('name') || 
            col.toLowerCase().includes('nome')
          );
          if (possibleCol) {
            profileColumn = possibleCol;
            console.log(`✅ Coluna descoberta: ${profileColumn}`);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️  Não foi possível descobrir a coluna, usando fallback: ${profileColumn}`);
    }

    // Busca o perfil ADMIN
    const profileResult = await query(
      `SELECT id FROM ${schema}.access_profile WHERE ${profileColumn} = 'admin' LIMIT 1`,
      []
    );

    if (profileResult.rows.length === 0) {
      console.log('💡 Perfil "admin" não encontrado. Criando...');
      
      // Cria o perfil admin se não existir
      const createProfileResult = await query(
        `INSERT INTO ${schema}.access_profile (${profileColumn}, description, created_at)
         VALUES ('admin', 'Administrador do sistema', NOW())
         RETURNING id`,
        []
      );
      
      const profileId = createProfileResult.rows[0].id;
      console.log(`✅ Perfil admin criado com ID: ${profileId}`);
      
      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Cria o usuário
      const userResult = await query(
        `INSERT INTO ${schema}.users (name, email, password_hash, profile_id, status, created_at)
         VALUES ($1, $2, $3, $4, 'ativo', NOW())
         RETURNING id, name, email, profile_id`,
        [name, email, password_hash, profileId]
      );

      const user = userResult.rows[0];
      console.log('✅ Usuário ADMIN criado com sucesso!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Perfil ID: ${user.profile_id}`);
      console.log(`   Senha: ${password}`);
    } else {
      const profileId = profileResult.rows[0].id;
      
      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Cria o usuário
      const userResult = await query(
        `INSERT INTO ${schema}.users (name, email, password_hash, profile_id, status, created_at)
         VALUES ($1, $2, $3, $4, 'ativo', NOW())
         RETURNING id, name, email, profile_id`,
        [name, email, password_hash, profileId]
      );

      const user = userResult.rows[0];
      console.log('✅ Usuário ADMIN criado com sucesso!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Perfil ID: ${user.profile_id}`);
      console.log(`   Senha: ${password}`);
    }

    await pool.end();
    console.log('✅ Conexão com banco de dados fechada.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário ADMIN:', error);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

createAdminUser();

