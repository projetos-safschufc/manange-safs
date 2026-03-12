# ⚠️ IMPORTANTE: Senhas com Caractere "#"

## O Problema

O caractere `#` em arquivos `.env` é usado para **comentários**. Isso significa que:

```env
# ❌ ERRADO - Senha será truncada!
DB_PASSWORD=abi123!@#qwe
```

Neste caso, o sistema interpretará:
- `DB_PASSWORD=abi123!@` ← Esta é a senha que será usada
- `#qwe` ← Isso será ignorado como comentário!

## A Solução

**SEMPRE use aspas** quando a senha contém `#`:

```env
# ✅ CORRETO - Com aspas simples
DB_PASSWORD='abi123!@#qwe'

# ✅ CORRETO - Com aspas duplas
DB_PASSWORD="abi123!@#qwe"
```

## Detecção Automática

O sistema agora **detecta automaticamente** se sua senha foi truncada:

1. **No script `create-admin`**: Se detectar que a senha foi truncada, o script **para imediatamente** e mostra uma mensagem de erro clara.

2. **No servidor**: Se detectar possível truncamento, mostra um aviso (mas não para o servidor).

## Exemplo de Erro Detectado

Se você usar `DB_PASSWORD=abi123!@#qwe` sem aspas, verá:

```
❌ ERRO CRÍTICO: A senha foi truncada!
   O arquivo .env contém "#" mas a senha carregada não.
   Solução: Use aspas no arquivo .env:
   DB_PASSWORD='abi123!@#qwe'
   
   Senha esperada (com #): **********
   Senha carregada: ********
```

## Formato Correto do .env

```env
DB_HOST=pgpool1.ebserh
DB_PORT=5433
DB_NAME=safs
DB_USER=abimael
DB_PASSWORD='abi123!@#qwe'  # ← Aspas simples são obrigatórias!
DB_SCHEMA=ctrl
```

## Outros Caracteres Especiais

- `!`, `@`, `$`, `%`, `&`, `*`: Geralmente funcionam sem aspas
- `#`: **SEMPRE** precisa de aspas
- Espaços: Precisam de aspas
- Caracteres Unicode: Podem precisar de aspas

## Testando

Após configurar o `.env` corretamente, teste:

```bash
npm run create-admin
```

Se a senha estiver correta, o script funcionará normalmente. Se houver truncamento, você verá o erro de detecção.

