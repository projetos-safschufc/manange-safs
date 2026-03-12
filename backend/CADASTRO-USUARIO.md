# Funcionalidade de Cadastro de Novo Usuário

## Visão Geral

Foi implementada uma funcionalidade completa para cadastro público de novos usuários. Quando um usuário se cadastra, ele recebe **automaticamente o perfil ID 3**.

## Endpoint da API

### POST `/api/users/register`

**Rota pública** - Não requer autenticação

**Body:**
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Usuário cadastrado com sucesso! Você pode fazer login agora.",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "profile_id": 3,
    "status": "ativo"
  }
}
```

## Funcionalidades Implementadas

### Back-end

1. **Controller `registerController.js`**:
   - Valida dados de entrada (nome, email, senha)
   - Verifica se email já existe
   - Valida se o perfil ID 3 existe no banco
   - Se perfil 3 não existir, tenta usar outro perfil disponível
   - Faz hash da senha com bcrypt
   - Cria usuário com perfil ID 3 automaticamente

2. **Validador `validateRegister`**:
   - Valida nome (mínimo 3 caracteres)
   - Valida email (formato correto)
   - Valida senha (mínimo 6 caracteres)
   - **Não requer** `profile_id` (é atribuído automaticamente)

3. **Rota pública**:
   - `/api/users/register` - Sempre disponível para cadastro

### Front-end

1. **Página de Cadastro (`Register.tsx`)**:
   - Formulário completo com validação
   - Campos: Nome, Email, Senha, Confirmar Senha
   - Validação de senhas iguais
   - Mensagem informativa sobre perfil padrão
   - Link para voltar ao login
   - Redirecionamento automático para login após cadastro

2. **Integração com Login**:
   - Link "Cadastre-se aqui" na página de login
   - Link "Já tem uma conta?" na página de cadastro
   - Rotas configuradas em `App.tsx`

## Fluxo de Cadastro

1. Usuário acessa `/register` ou clica em "Cadastre-se aqui" no login
2. Preenche o formulário (nome, email, senha, confirmar senha)
3. Submete o formulário
4. Back-end valida os dados
5. Back-end verifica se email já existe
6. Back-end atribui automaticamente o **perfil ID 3**
7. Back-end cria o usuário no banco
8. Front-end mostra mensagem de sucesso
9. Redireciona para página de login após 2 segundos

## Validações

- **Nome**: Mínimo 3 caracteres, obrigatório
- **Email**: Formato válido, obrigatório, único no sistema
- **Senha**: Mínimo 6 caracteres, obrigatória
- **Confirmar Senha**: Deve ser igual à senha

## Segurança

- Senhas são hasheadas com bcrypt (10 rounds)
- Validação de email único
- Rate limiting aplicado (via `apiLimiter`)
- Validação de dados com Joi

## Tratamento de Erros

- Email já cadastrado → Erro 400
- Perfil ID 3 não existe → Tenta usar outro perfil disponível
- Dados inválidos → Erro 400 com detalhes
- Erro de servidor → Erro 500

## Teste

Para testar o cadastro:

1. Acesse `http://localhost:5173/register`
2. Preencha o formulário
3. Clique em "Cadastrar"
4. Verifique se o usuário foi criado com `profile_id = 3`

## Notas Importantes

- O perfil ID 3 **deve existir** na tabela `ctrl.access_profile`
- Se o perfil 3 não existir, o sistema tentará usar outro perfil disponível
- Usuários cadastrados recebem status "ativo" automaticamente
- A funcionalidade está sempre disponível (não depende de haver ou não usuários no sistema)

