import app from './app.js';
import { config } from './config/env.js';
import pool from './config/db.js';

const PORT = config.port;

// Testa conexão com o banco antes de iniciar o servidor
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Banco de dados conectado com sucesso');
    
    // Inicia o servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📝 Ambiente: ${config.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
      console.log(`🌍 Acessível em: http://0.0.0.0:${PORT} e http://10.28.0.124:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalhes:', error.detail || 'N/A');
    
    if (error.code === '28P01') {
      console.error('\n💡 Dica: Falha na autenticação.');
      console.error('   Verifique se o usuário e senha estão corretos no arquivo .env');
      console.error('   A senha pode conter caracteres especiais que precisam ser escapados.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Não foi possível conectar ao servidor PostgreSQL.');
      console.error('   Verifique se o servidor está rodando e acessível.');
      console.error('   Verifique também o host e porta no arquivo .env');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Dica: Host não encontrado.');
      console.error('   Verifique se o nome do host está correto no arquivo .env');
    } else if (error.code === '3D000') {
      console.error('\n💡 Dica: Banco de dados não existe.');
      console.error('   Verifique se o nome do banco está correto no arquivo .env');
    }
    
    console.error('\n📝 Verifique o arquivo .env na pasta backend/');
    process.exit(1);
  });

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  pool.end(() => {
    console.log('Pool de conexões fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor...');
  pool.end(() => {
    console.log('Pool de conexões fechado');
    process.exit(0);
  });
});

