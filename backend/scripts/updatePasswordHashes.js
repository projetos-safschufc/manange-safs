import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../.env');

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
 * Script para atualizar hashes MD5 para bcrypt
 * ATENÇÃO: Este script requer que você forneça as senhas corretas para cada usuário
 */
async function updatePasswordHashes() {
  try {
    console.log('🔧 Iniciando atualização de hashes de senha...\n');

    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida!\n');

    const schema = process.env.DB_SCHEMA || 'ctrl';

    // Busca todos os usuários com hash que não é bcrypt
    console.log('📋 Buscando usuários com hash inválido...');
    const users = await query(
      `SELECT id, name, email, password_hash FROM ${schema}.users WHERE status = 'ativo'`,
      []
    );

    console.log(`\n📊 Total de usuários encontrados: ${users.rows.length}\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users.rows) {
      const isBcrypt = user.password_hash && user.password_hash.startsWith('$2');
      
      if (!isBcrypt) {
        console.log(`⚠️  Usuário ID ${user.id}: ${user.email}`);
        console.log(`   Hash atual: ${user.password_hash.substring(0, 30)}...`);
        console.log(`   ⚠️  Este usuário precisa ter a senha atualizada manualmente.`);
        console.log(`   Para atualizar, execute:`);
        console.log(`   UPDATE ${schema}.users SET password_hash = '<novo_hash_bcrypt>' WHERE id = ${user.id};`);
        console.log('');
        skippedCount++;
      } else {
        console.log(`✅ Usuário ID ${user.id}: ${user.email} - Hash válido (bcrypt)`);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Usuários com hash válido: ${users.rows.length - skippedCount}`);
    console.log(`   ⚠️  Usuários com hash inválido: ${skippedCount}`);
    
    if (skippedCount > 0) {
      console.log(`\n💡 Para atualizar um usuário específico, use:`);
      console.log(`   npm run fix-admin`);
      console.log(`   Ou atualize manualmente no banco de dados.`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

updatePasswordHashes();

