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
  if (envResult.error && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Arquivo .env não encontrado em:', envPath);
    console.warn('   Tentando carregar do diretório padrão...');
    dotenv.config();
  }
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5433,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA || 'ctrl',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

