/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // Adicione outras variáveis de ambiente aqui conforme necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'vite' {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }
}

