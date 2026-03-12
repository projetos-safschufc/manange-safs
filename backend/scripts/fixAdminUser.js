import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
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
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      value = processEnvValue(value);
      
      process.env[key] = value;
      envVars[key] = value;
    }
    
    return { parsed: envVars, error: null };
  } catch (error) {
    return { parsed: {}, error };
  }
};

// Carrega .env
loadEnvManually(envPath);
if (!process.env.DB_PASSWORD) {
  dotenv.config({ path: envPath });
}

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

const { Pool } = pg;

const pool = new Pool({
  ...dbConfig,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: false,
});

const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res;
};

/**
 * Script para corrigir/atualizar usuário ADMIN
 */
async function fixAdminUser() {
  try {
    console.log('🔧 Iniciando correção do usuário ADMIN...\n');

    // Testa conexão
    console.log('🔌 Testando conexão com o banco de dados...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida!\n');

    const schema = process.env.DB_SCHEMA || 'ctrl';
    const adminEmail = 'admin@ebserh.gov.br';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';

    // Descobre a coluna de nome do perfil
    console.log('🔍 Descobrindo estrutura da tabela access_profile...');
    let profileColumn = 'name';
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
        console.log(`✅ Coluna encontrada: ${profileColumn}\n`);
      } else {
        const testResult = await query(`SELECT * FROM ${schema}.access_profile LIMIT 1`, []);
        if (testResult.rows.length > 0) {
          const columns = Object.keys(testResult.rows[0]);
          const possibleCol = columns.find(col => 
            col.toLowerCase().includes('name') || 
            col.toLowerCase().includes('nome')
          );
          if (possibleCol) {
            profileColumn = possibleCol;
            console.log(`✅ Coluna descoberta: ${profileColumn}\n`);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️  Usando fallback: ${profileColumn}\n`);
    }

    // Busca ou cria perfil ADMIN
    console.log('📋 Verificando perfil ADMIN...');
    let profileResult = await query(
      `SELECT id FROM ${schema}.access_profile WHERE ${profileColumn} ILIKE 'admin' LIMIT 1`,
      []
    );

    let adminProfileId;
    if (profileResult.rows.length === 0) {
      console.log('💡 Perfil ADMIN não encontrado. Criando...');
      const createResult = await query(
        `INSERT INTO ${schema}.access_profile (${profileColumn}, description, created_at)
         VALUES ('admin', 'Administrador do sistema', NOW())
         RETURNING id`,
        []
      );
      adminProfileId = createResult.rows[0].id;
      console.log(`✅ Perfil ADMIN criado com ID: ${adminProfileId}\n`);
    } else {
      adminProfileId = profileResult.rows[0].id;
      console.log(`✅ Perfil ADMIN encontrado com ID: ${adminProfileId}\n`);
    }

    // Verifica se usuário ADMIN já existe
    console.log('📋 Verificando usuário ADMIN...');
    const existingUser = await query(
      `SELECT id, email, password_hash, profile_id FROM ${schema}.users WHERE email = $1`,
      [adminEmail]
    );

    const password_hash = await bcrypt.hash(adminPassword, 10);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`⚠️  Usuário encontrado (ID: ${user.id})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Profile ID atual: ${user.profile_id}`);
      console.log(`   Hash atual: ${user.password_hash.substring(0, 20)}...`);
      
      // Verifica se o hash é bcrypt
      const isBcrypt = user.password_hash.startsWith('$2');
      
      if (!isBcrypt || user.profile_id !== adminProfileId) {
        console.log('\n🔧 Atualizando usuário ADMIN...');
        await query(
          `UPDATE ${schema}.users 
           SET password_hash = $1, profile_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [password_hash, adminProfileId, user.id]
        );
        console.log('✅ Usuário ADMIN atualizado com sucesso!');
      } else {
        console.log('✅ Usuário ADMIN já está configurado corretamente.');
      }
    } else {
      console.log('💡 Criando novo usuário ADMIN...');
      const userResult = await query(
        `INSERT INTO ${schema}.users (name, email, password_hash, profile_id, status, created_at)
         VALUES ($1, $2, $3, $4, 'ativo', NOW())
         RETURNING id, name, email, profile_id`,
        [adminName, adminEmail, password_hash, adminProfileId]
      );
      const user = userResult.rows[0];
      console.log('✅ Usuário ADMIN criado com sucesso!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Profile ID: ${user.profile_id}`);
    }

    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('\n✅ Processo concluído com sucesso!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao corrigir usuário ADMIN:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

fixAdminUser();

