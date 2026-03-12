/**
 * Helper para processar variáveis de ambiente corretamente
 * Remove aspas e trata caracteres especiais
 */

/**
 * Processa um valor de variável de ambiente
 * Remove aspas simples ou duplas se presentes
 * @param {string} value - Valor da variável de ambiente
 * @returns {string} - Valor processado
 */
export const processEnvValue = (value) => {
  if (!value) return value;
  
  // Remove aspas simples ou duplas do início e fim
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
 * Valida se uma senha pode ter sido truncada por caracteres especiais
 * @param {string} password - Senha a validar
 * @param {string} expectedPattern - Padrão esperado (opcional)
 * @returns {boolean} - True se pode estar truncada
 */
export const isPasswordPossiblyTruncated = (password) => {
  if (!password) return false;
  
  // Se a senha contém caracteres que podem causar problemas mas não estão protegidos
  // Verifica padrões comuns de truncamento
  const suspiciousPatterns = [
    /^[^#]*$/, // Não contém # mas deveria
    /!@$/, // Termina com !@ (possível truncamento antes de #)
  ];
  
  // Se a senha é muito curta e contém caracteres especiais no final
  if (password.length < 8 && /[!@]$/.test(password)) {
    return true;
  }
  
  return false;
};

/**
 * Carrega e processa variáveis de ambiente com tratamento especial para senhas
 * @param {string} envPath - Caminho do arquivo .env
 * @returns {object} - Resultado do carregamento
 */
export const loadEnvWithPasswordSupport = (envPath) => {
  const dotenv = require('dotenv');
  const fs = require('fs');
  const path = require('path');
  
  // Lê o arquivo .env manualmente para processar senhas corretamente
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    const envVars = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ignora linhas vazias e comentários
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Processa linha no formato KEY=VALUE
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Remove aspas se presentes
      value = processEnvValue(value);
      
      envVars[key] = value;
    }
    
    // Define as variáveis no process.env
    for (const [key, value] of Object.entries(envVars)) {
      process.env[key] = value;
    }
    
    return { parsed: envVars, error: null };
  }
  
  // Fallback para dotenv padrão
  return dotenv.config({ path: envPath });
};

