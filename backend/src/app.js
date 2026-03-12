import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiLimiter, filterLimiter } from './middlewares/rateLimiter.js';

// Importar rotas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import funcionarioRoutes from './routes/funcionarioRoutes.js';
import catalogoRoutes from './routes/catalogoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// resolver __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares de segurança
app.use(helmet());

// CORS configurado para aceitar múltiplas origens
const allowedOrigins = (config.frontendUrl || '').split(',').map(url => url.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verifica se a origin está na lista permitida
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS bloqueado para origin: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
}));

// Middlewares de parsing com suporte UTF-8
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Middleware para garantir charset UTF-8 em todas as respostas
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting geral
app.use('/api', apiLimiter);

// Rotas
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Servir frontend em produção
const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');
app.use(express.static(frontendBuildPath));

// Fallback para SPA (depois das rotas /api)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
// Middleware de erro 404
app.use(notFound);

// Middleware global de tratamento de erros
app.use(errorHandler);

export default app;