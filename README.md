# GEST-SAFS - Sistema de Gestão de Materiais

Sistema full-stack desenvolvido para gestão de materiais do EBSERH (Empresa Brasileira de Serviços Hospitalares), utilizando React + TypeScript no front-end e Node.js + Express + PostgreSQL no back-end.

## 🎨 Identidade Visual

O sistema utiliza as cores oficiais da marca EBSERH:
- **Verde**: `#00A859` (cor primária)
- **Cinza Escuro**: `#4A4A4A` (cor secundária)
- **Branco**: Para backgrounds e contraste

## 🏗️ Arquitetura

### Back-end
- **Node.js** com **Express** (ES Modules)
- **PostgreSQL** como banco de dados
- **JWT** para autenticação com refresh tokens
- **bcrypt** para hash de senhas
- **Joi** para validação de dados
- **Helmet** e **CORS** para segurança
- **Express Rate Limit** para proteção contra ataques

### Front-end
- **React 18** com **TypeScript**
- **Vite** como build tool
- **Redux Toolkit** para gerenciamento de estado
- **Material-UI (MUI)** para componentes de UI
- **MUI DataGrid** para tabelas avançadas
- **React Router** para navegação
- **Formik + Yup** para formulários e validações
- **Axios** para requisições HTTP
- **React Toastify** para notificações

## 📋 Pré-requisitos

- **Node.js** 18+ e npm/yarn
- **PostgreSQL** (acesso ao banco de dados configurado)
- **Git**

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd manange_safs
```

### 2. Configuração do Back-end

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend` com as seguintes configurações:

```env
# Banco de Dados
DB_HOST=pgpool1.ebserh
DB_PORT=5433
DB_NAME=safs
DB_USER=abimael
DB_PASSWORD='abi123!@#qwe'
DB_SCHEMA=ctrl

# Servidor
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE**: 
- Nunca commite o arquivo `.env` no Git. Ele já está no `.gitignore`.
- Se a senha contiver caracteres especiais (como `#`), use aspas simples: `DB_PASSWORD='sua-senha-com-#'`
- Veja mais detalhes em `backend/SENHA-ESPECIAL.md` e `backend/TROUBLESHOOTING.md`

### 2.1. Criar usuário ADMIN inicial

Após configurar o `.env`, execute um dos scripts para criar o usuário ADMIN:

**Opção 1: Criar usuário ADMIN padrão**
```bash
npm run create-admin
```
Isso criará o usuário ADMIN com:
- **Nome**: IVALNEI
- **Email**: ivalnei@gmail.com
- **Senha**: oriximina

**Opção 2: Criar/atualizar usuário ADMIN padrão do sistema**
```bash
npm run fix-admin
```
Isso criará/atualizará um usuário ADMIN com:
- **Email**: admin@ebserh.gov.br
- **Senha**: admin123

**Opção 3: Verificar e atualizar senhas MD5 para bcrypt**
```bash
npm run check-passwords
```

### 3. Configuração do Front-end

```bash
cd frontend
npm install
```

Opcionalmente, crie um arquivo `.env` na pasta `frontend` se precisar configurar a URL da API:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Executar a aplicação

#### Back-end (Terminal 1)

```bash
cd backend
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

#### Front-end (Terminal 2)

```bash
cd frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📚 Estrutura do Projeto

```
manange_safs/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (banco, env)
│   │   │   ├── db.js        # Pool de conexões PostgreSQL
│   │   │   └── env.js       # Carregamento de variáveis de ambiente
│   │   ├── controllers/     # Controllers da API
│   │   │   ├── authController.js
│   │   │   ├── catalogoController.js
│   │   │   ├── funcionarioController.js
│   │   │   ├── registerController.js
│   │   │   └── userController.js
│   │   ├── middlewares/     # Middlewares (auth, validação, erros)
│   │   │   ├── auth.js      # Autenticação JWT e autorização RBAC
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validators.js # Validação Joi
│   │   ├── models/          # Modelos de dados (queries SQL)
│   │   │   ├── catalogoModel.js
│   │   │   ├── funcionarioModel.js
│   │   │   └── userModel.js
│   │   ├── routes/          # Rotas da API
│   │   │   ├── authRoutes.js
│   │   │   ├── catalogoRoutes.js
│   │   │   ├── funcionarioRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── utils/           # Utilitários
│   │   │   ├── dbSchema.js  # Descoberta dinâmica de schema
│   │   │   ├── envHelper.js # Helper para .env com caracteres especiais
│   │   │   └── filterHelpers.js # Helpers para filtros SQL
│   │   ├── app.js           # Configuração do Express
│   │   └── server.js        # Ponto de entrada do servidor
│   ├── scripts/             # Scripts utilitários
│   │   ├── createAdminUser.js
│   │   ├── fixAdminUser.js
│   │   └── updatePasswordHashes.js
│   ├── package.json
│   ├── README-SETUP.md      # Guia de setup detalhado
│   ├── TROUBLESHOOTING.md   # Guia de solução de problemas
│   └── SENHA-ESPECIAL.md    # Guia para senhas com caracteres especiais
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes reutilizáveis
    │   │   ├── EbserhLogo.tsx
    │   │   ├── Layout.tsx
    │   │   ├── ModernHeader.tsx
    │   │   └── PrivateRoute.tsx
    │   ├── hooks/           # Custom hooks
    │   │   └── useIsAdmin.ts # Hook para verificar se é ADMIN
    │   ├── pages/           # Páginas da aplicação
    │   │   ├── AtribuirResponsabilidade.tsx
    │   │   ├── CadastroCatalogo.tsx
    │   │   ├── CadastroFuncionario.tsx
    │   │   ├── CadastroUsuarios.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── EditarCatalogo.tsx
    │   │   ├── EditarFuncionario.tsx
    │   │   ├── GestaoUsuarios.tsx
    │   │   ├── ListaCatalogo.tsx
    │   │   ├── ListaFuncionarios.tsx
    │   │   ├── Login.tsx
    │   │   └── Register.tsx
    │   ├── services/        # Serviços (API client)
    │   │   └── api.ts       # Cliente Axios configurado
    │   ├── store/           # Redux store e slices
    │   │   ├── slices/
    │   │   │   ├── authSlice.ts
    │   │   │   ├── catalogSlice.ts
    │   │   │   └── funcionarioSlice.ts
    │   │   └── store.ts
    │   ├── theme/           # Tema Material-UI
    │   │   └── theme.ts
    │   ├── types/           # Tipos TypeScript
    │   │   └── index.ts
    │   ├── utils/           # Utilitários
    │   │   └── filterUtils.ts
    │   ├── App.tsx          # Componente principal
    │   ├── main.tsx         # Ponto de entrada
    │   └── vite-env.d.ts    # Declarações de tipos Vite
    ├── package.json
    └── vite.config.ts
```

## 🔐 Autenticação e Autorização

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação. Após o login, o token é armazenado no `localStorage` e enviado automaticamente em todas as requisições via header `Authorization: Bearer <token>`.

### Perfis de Usuário

O sistema possui controle de acesso baseado em perfis (`ctrl.access_profile`):

- **ADMIN (profile_id = 1)**: Acesso completo ao sistema
  - Gestão de usuários (visualizar, editar, deletar)
  - Gestão de funcionários (CRUD completo)
  - Gestão de catálogo (CRUD completo)
  - Cadastro de novos usuários administrativos
  
- **USUÁRIO COMUM (profile_id = 3)**: Acesso limitado
  - Visualização de catálogo
  - Atribuição de responsabilidades
  - Não pode acessar gestão de funcionários
  - Não pode criar/editar/deletar itens do catálogo

### Cadastro Público

Usuários podem se cadastrar publicamente através da rota `/register`. Ao se cadastrar, recebem automaticamente o perfil padrão (ID 3 - Usuário Comum).

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login (retorna token JWT)
- `POST /api/auth/refresh` - Refresh token

### Usuários
- `GET /api/users` - Lista usuários (requer ADMIN)
- `POST /api/users` - Cria usuário (requer ADMIN)
- `POST /api/users/register` - Cadastro público (sem autenticação)
- `GET /api/users/:id` - Busca usuário por ID (requer ADMIN)
- `PUT /api/users/:id` - Atualiza usuário (requer ADMIN)
- `PATCH /api/users/:id/profile` - Atualiza perfil do usuário (requer ADMIN)
- `PATCH /api/users/:id/status` - Atualiza status do usuário (requer ADMIN)
- `DELETE /api/users/:id` - Deleta usuário permanentemente (requer ADMIN)
- `GET /api/users/profiles` - Lista perfis de acesso disponíveis

### Funcionários
- `GET /api/funcionarios` - Lista funcionários com filtros e paginação (requer ADMIN)
- `POST /api/funcionarios` - Cria funcionário (requer ADMIN)
- `GET /api/funcionarios/:id` - Busca funcionário por ID (requer ADMIN)
- `PUT /api/funcionarios/:id` - Atualiza funcionário (requer ADMIN)
- `PATCH /api/funcionarios/:id/toggle-status` - Alterna status ativo/inativo (requer ADMIN)
- `DELETE /api/funcionarios/:id` - Deleta funcionário (requer ADMIN)

### Catálogo
- `GET /api/catalogo` - Lista itens do catálogo com filtros e paginação
- `POST /api/catalogo` - Cria item no catálogo (requer ADMIN)
- `GET /api/catalogo/:id` - Busca item por ID
- `PUT /api/catalogo/:id` - Atualiza item (requer ADMIN)
- `DELETE /api/catalogo/:id` - Deleta item (requer ADMIN)
- `POST /api/catalogo/update-multiple` - Atualiza múltiplos itens (requer ADMIN)
- `GET /api/catalogo/servicos-aquisicao` - Lista serviços de aquisição únicos
- `GET /api/catalogo/grupos-catalogo` - Lista grupos (GR) únicos do catálogo
- `GET /api/catalogo/grupos` - Lista grupos de materiais (legado)

## 🎯 Funcionalidades Principais

### 1. Autenticação e Autorização
- Login com JWT e refresh tokens
- Controle de sessão persistente (localStorage)
- Redirecionamento automático em caso de token expirado
- Proteção de rotas baseada em perfis

### 2. Dashboard
- Visão geral do sistema
- Estatísticas e métricas (em desenvolvimento)

### 3. Gestão de Usuários (ADMIN apenas)
- Listagem de usuários com filtros (nome, email, perfil, status)
- Criação de novos usuários administrativos
- Edição de perfil e status de usuários
- Exclusão permanente de usuários
- Cadastro público de novos usuários (perfil padrão)

### 4. Gestão de Funcionários (ADMIN apenas)
- CRUD completo de funcionários
- Filtros avançados (nome, setor, cargo, status)
- Paginação server-side
- Ativação/desativação de funcionários
- Visualização detalhada

### 5. Gestão de Catálogo
- **Visualização**: Todos os usuários autenticados
- **CRUD**: Apenas ADMIN
- Listagem com filtros avançados:
  - Texto livre (master, descrição, responsável)
  - Dropdowns (Serv. Aquisição, GR)
  - Paginação server-side
  - Persistência de filtros na URL
- Gerenciamento de visibilidade de colunas (persistido em localStorage)
- Formatação UTF-8 para caracteres portugueses

### 6. Atribuição de Responsabilidades
- Filtros para seleção de materiais (Master, Descrição, Serv. Aquisição, GR)
- Seleção múltipla de materiais via checkbox
- Edição individual de responsável por linha
- Atribuição em massa via select-box de funcionários
- Atualização em lote no backend

## 🛠️ Scripts Disponíveis

### Back-end

```bash
npm start              # Inicia o servidor em produção
npm run dev            # Inicia o servidor em modo desenvolvimento (nodemon)
npm run create-admin   # Cria usuário ADMIN inicial (IVALNEI)
npm run fix-admin      # Cria/atualiza usuário ADMIN padrão (admin@ebserh.gov.br)
npm run check-passwords # Verifica e atualiza senhas MD5 para bcrypt
```

### Front-end

```bash
npm run dev            # Inicia o servidor de desenvolvimento
npm run build          # Gera build de produção
npm run preview        # Preview do build de produção
npm run lint           # Executa o linter
```

## 🔒 Segurança

- **Senhas**: Hash com bcrypt (10 rounds)
- **Tokens JWT**: Com expiração configurável (24h padrão)
- **Refresh Tokens**: Para renovação automática de sessão
- **Rate Limiting**: Nas rotas de autenticação
- **CORS**: Configurado para o front-end
- **Helmet**: Headers de segurança HTTP
- **Validação**: Inputs validados no back-end (Joi) e front-end (Yup)
- **SQL Injection**: Prevenido com prepared statements
- **RBAC**: Controle de acesso baseado em perfis

## 📝 Variáveis de Ambiente

### Back-end (.env)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DB_HOST` | Host do PostgreSQL | - |
| `DB_PORT` | Porta do PostgreSQL | 5433 |
| `DB_NAME` | Nome do banco de dados | - |
| `DB_USER` | Usuário do banco | - |
| `DB_PASSWORD` | Senha do banco (use aspas se tiver `#`) | - |
| `DB_SCHEMA` | Schema do banco | `ctrl` |
| `PORT` | Porta do servidor Express | 5000 |
| `NODE_ENV` | Ambiente (development/production) | development |
| `JWT_SECRET` | Chave secreta para JWT | - |
| `JWT_REFRESH_SECRET` | Chave secreta para refresh token | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | 24h |
| `JWT_REFRESH_EXPIRES_IN` | Tempo de expiração do refresh token | 7d |
| `FRONTEND_URL` | URL do front-end para CORS | http://localhost:5173 |

### Front-end (.env)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL da API backend | http://localhost:5000/api |

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no `.env`
   - Veja `backend/TROUBLESHOOTING.md` para mais detalhes

2. **Senha com caracteres especiais não funciona**
   - Use aspas simples no `.env`: `DB_PASSWORD='sua-senha-com-#'`
   - Veja `backend/SENHA-ESPECIAL.md` para mais detalhes

3. **Erro "Cannot find module"**
   - Execute `npm install` novamente
   - Verifique se está usando Node.js 18+

4. **Token expirado**
   - Faça login novamente
   - O sistema redireciona automaticamente para `/login`

5. **Acesso negado em rotas ADMIN**
   - Verifique se o usuário tem `profile_id = 1`
   - Use `npm run fix-admin` para criar/atualizar usuário ADMIN

Para mais detalhes, consulte:
- `backend/TROUBLESHOOTING.md` - Guia completo de solução de problemas
- `backend/SENHA-ESPECIAL.md` - Guia para senhas com caracteres especiais
- `backend/README-SETUP.md` - Guia detalhado de setup

## 🧪 Desenvolvimento

### Boas Práticas

**Back-end:**
- Use transações SQL para operações atômicas
- Valide todos os inputs com Joi
- Use prepared statements para evitar SQL injection
- Trate erros adequadamente com errorHandler
- Use logs para debug (console.log/console.error)

**Front-end:**
- Componentes funcionais com hooks
- Validação de formulários com Formik+Yup
- Tratamento de erros com try/catch e toast notifications
- Use TypeScript para type safety
- Mantenha estado global no Redux quando necessário

### Estrutura de Código

- **Controllers**: Lógica de negócio e resposta HTTP
- **Models**: Queries SQL e interação com banco
- **Routes**: Definição de rotas e middlewares
- **Middlewares**: Autenticação, validação, tratamento de erros
- **Utils**: Funções auxiliares reutilizáveis

## 📄 Documentação Adicional

- `backend/README-SETUP.md` - Guia detalhado de configuração
- `backend/TROUBLESHOOTING.md` - Solução de problemas comuns
- `backend/SENHA-ESPECIAL.md` - Tratamento de senhas especiais
- `backend/CADASTRO-USUARIO.md` - Documentação do cadastro público

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da EBSERH - Empresa Brasileira de Serviços Hospitalares.

---

**Desenvolvido para EBSERH - Empresa Brasileira de Serviços Hospitalares**

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024
