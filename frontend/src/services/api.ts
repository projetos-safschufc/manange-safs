import axios from 'axios';

const API_URL = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5001/api';

// Cria instância do Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  responseType: 'json',
  responseEncoding: 'utf8',
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação e rede
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erro de autenticação
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Erro de rede (servidor não respondeu)
    if (!error.response) {
      console.error('❌ Erro de rede:', error.message);
      // Mantém o erro para ser tratado pelo componente
    }
    
    return Promise.reject(error);
  }
);

export default api;

