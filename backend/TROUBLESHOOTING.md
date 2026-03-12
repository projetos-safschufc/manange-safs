# Guia de Troubleshooting - GEST-SAFS Backend

## Problemas Comuns de Conexão com Banco de Dados

### 1. Erro: "Variáveis de ambiente não configuradas"

**Sintoma**: O script ou servidor não encontra as variáveis de ambiente.

**Solução**:
1. Verifique se o arquivo `.env` existe na pasta `backend/`
2. Verifique se o arquivo contém todas as variáveis necessárias:
   ```
   DB_HOST=pgpool1.ebserh
   DB_PORT=5433
   DB_NAME=safs
   DB_USER=abimael
   DB_PASSWORD=abi123!@#qwe
   DB_SCHEMA=ctrl
   ```
3. Certifique-se de que não há espaços antes ou depois do `=`
4. Não use aspas nas variáveis (a menos que sejam necessárias)

### 2. Erro: "password authentication failed" (Código: 28P01)

**Sintoma**: Falha na autenticação com o banco de dados.

**Possíveis causas e soluções**:

#### a) Senha com caracteres especiais (ESPECIALMENTE `#`)

**⚠️ IMPORTANTE**: O caractere `#` em arquivos `.env` é usado para comentários!

Se você usar `DB_PASSWORD=abi123!@#qwe` sem aspas, tudo após o `#` será ignorado como comentário, resultando na senha sendo apenas `abi123!@`.

**Solução OBRIGATÓRIA**: Use aspas simples ou duplas:

```env
# ✅ CORRETO - Com aspas simples
DB_PASSWORD='abi123!@#qwe'

# ✅ CORRETO - Com aspas duplas  
DB_PASSWORD="abi123!@#qwe"

# ❌ ERRADO - Sem aspas (senha será truncada!)
DB_PASSWORD=abi123!@#qwe
```

**Outros caracteres especiais**:
- `!`, `@`, `$`, `%`, `&`, `*` geralmente funcionam sem aspas
- `#` **SEMPRE** precisa de aspas
- Espaços precisam de aspas
- Caracteres Unicode podem precisar de aspas

**O sistema agora detecta automaticamente** se a senha foi truncada e avisa você!

#### b) Senha incorreta
- Verifique se a senha está correta
- Teste a conexão manualmente com `psql`:
  ```bash
  psql -h pgpool1.ebserh -p 5433 -U abimael -d safs
  ```

#### c) Usuário não existe ou não tem permissões
- Verifique se o usuário `abimael` existe no PostgreSQL
- Verifique se o usuário tem permissões para acessar o banco `safs`

### 3. Erro: "ECONNREFUSED"

**Sintoma**: Não foi possível conectar ao servidor PostgreSQL.

**Soluções**:
1. Verifique se o servidor PostgreSQL está rodando
2. Verifique se o host está correto:
   - Se `pgpool1.ebserh` não resolver, tente o IP do servidor
   - Verifique se há acesso de rede ao servidor
3. Verifique se a porta está correta (5433)
4. Verifique firewall e regras de rede
5. Teste a conectividade:
   ```bash
   telnet pgpool1.ebserh 5433
   # ou
   nc -zv pgpool1.ebserh 5433
   ```

### 4. Erro: "ENOTFOUND"

**Sintoma**: Host não encontrado.

**Soluções**:
1. Verifique se o nome do host está correto no `.env`
2. Se estiver em uma rede interna, verifique o DNS
3. Tente usar o IP do servidor ao invés do nome:
   ```env
   DB_HOST=192.168.1.100  # substitua pelo IP correto
   ```

### 5. Erro: "database does not exist" (Código: 3D000)

**Sintoma**: O banco de dados não existe.

**Soluções**:
1. Verifique se o nome do banco está correto no `.env`
2. Crie o banco de dados se necessário:
   ```sql
   CREATE DATABASE safs;
   ```
3. Verifique se o usuário tem permissão para acessar o banco

### 6. Erro: "schema does not exist"

**Sintoma**: O schema `ctrl` não existe.

**Soluções**:
1. Crie o schema se necessário:
   ```sql
   CREATE SCHEMA IF NOT EXISTS ctrl;
   ```
2. Ou altere o `DB_SCHEMA` no `.env` para um schema existente

## Formato Correto do Arquivo .env

```env
# Sem espaços antes ou depois do =
DB_HOST=pgpool1.ebserh
DB_PORT=5433
DB_NAME=safs
DB_USER=abimael

# Para senhas com caracteres especiais, use aspas simples
DB_PASSWORD='abi123!@#qwe'

# Ou sem aspas se não houver caracteres problemáticos
# DB_PASSWORD=senha123

DB_SCHEMA=ctrl
PORT=5000
NODE_ENV=development
```

## Testando a Conexão Manualmente

### Com psql (se disponível):
```bash
psql -h pgpool1.ebserh -p 5433 -U abimael -d safs
```

### Com Node.js:
Crie um arquivo `test-connection.js`:
```javascript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

client.connect()
  .then(() => {
    console.log('✅ Conexão bem-sucedida!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log('Data/hora do servidor:', res.rows[0].now);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Erro:', err.message);
    console.error('Código:', err.code);
    client.end();
  });
```

Execute:
```bash
node test-connection.js
```

## Logs e Debug

Para ver mais detalhes sobre a conexão, adicione ao `.env`:
```env
NODE_ENV=development
DEBUG=pg:*
```

Isso mostrará logs detalhados das tentativas de conexão.

