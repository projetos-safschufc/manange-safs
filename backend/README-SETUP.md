# Configuração Inicial - GEST-SAFS Backend

## Passo 1: Criar arquivo .env

Crie um arquivo `.env` na pasta `backend` com o seguinte conteúdo:

```env
# Configurações do Banco de Dados PostgreSQL
DB_HOST=pgpool1.ebserh
DB_PORT=5433
DB_NAME=safs
DB_USER=abimael
# ⚠️ CRÍTICO: Para senhas com "#", SEMPRE use aspas!
# Sem aspas, tudo após "#" será tratado como comentário
DB_PASSWORD='abi123!@#qwe'
DB_SCHEMA=ctrl

# Configurações do Servidor
PORT=5000
NODE_ENV=development

# JWT Secret (gerar uma chave segura em produção)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL para CORS
FRONTEND_URL=http://localhost:5173
```

## Passo 2: Criar usuário ADMIN inicial

Após criar o arquivo `.env`, execute:

```bash
npm run create-admin
```

Isso criará o usuário ADMIN com as seguintes credenciais:
- **Nome**: IVALNEI
- **Email**: ivalnei@gmail.com
- **Senha**: oriximina

## Passo 3: Iniciar o servidor

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

---

**Nota**: O arquivo `.env` não deve ser commitado no Git (já está no `.gitignore`).

## ⚠️ Problemas Comuns

### Senha com Caracteres Especiais

Se sua senha contém caracteres especiais como `!@#$`, use aspas simples no `.env`:

```env
DB_PASSWORD='abi123!@#qwe'
```

### Erro de Autenticação

Se receber erro "password authentication failed":
1. Verifique se a senha está correta
2. Teste a conexão manualmente com `psql`
3. Verifique se o usuário existe e tem permissões

Para mais detalhes, consulte o arquivo `TROUBLESHOOTING.md`.

