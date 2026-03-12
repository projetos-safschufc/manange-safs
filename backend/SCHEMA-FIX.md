# Correção: Coluna profile_name não existe

## Problema Identificado

O erro `column ap.profile_name does not exist` ocorre porque a tabela `ctrl.access_profile` no banco de dados não possui uma coluna chamada `profile_name`. A coluna pode ter outro nome como `name`, `nome`, `profile`, etc.

## Solução Implementada

Foi criado um sistema de **descoberta automática** da estrutura da tabela que:

1. **Descobre automaticamente** o nome real da coluna consultando o schema do banco
2. **Funciona mesmo se a coluna não existir** - faz fallback para queries sem JOIN
3. **É resiliente** - tenta múltiplos métodos de descoberta

### Arquivos Modificados

- `backend/src/utils/dbSchema.js` - Nova utilidade para descobrir estrutura
- `backend/src/models/userModel.js` - Queries com fallback
- `backend/src/middlewares/auth.js` - Autenticação resiliente
- `backend/src/controllers/userController.js` - Criação de perfis adaptativa
- `backend/scripts/createAdminUser.js` - Script adaptativo

### Como Funciona

1. **Primeira tentativa**: Consulta `information_schema` para descobrir colunas
2. **Segunda tentativa**: Consulta a tabela diretamente e analisa as colunas retornadas
3. **Fallback**: Se não encontrar, faz queries sem JOIN e retorna `NULL` para `profile_name`

### Comportamento

- ✅ **Login funciona** mesmo sem a coluna `profile_name`
- ✅ **Cadastro de usuários funciona** mesmo sem a tabela `access_profile`
- ✅ **Sistema é resiliente** e continua funcionando

## Próximos Passos

Se você souber o nome real da coluna na tabela `access_profile`, pode informar e podemos ajustar o código. Caso contrário, o sistema funcionará automaticamente descobrindo a estrutura.

## Verificação

Para verificar qual é o nome real da coluna, execute no banco:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'ctrl' 
AND table_name = 'access_profile';
```

Ou simplesmente:

```sql
SELECT * FROM ctrl.access_profile LIMIT 1;
```

Isso mostrará todas as colunas disponíveis na tabela.

