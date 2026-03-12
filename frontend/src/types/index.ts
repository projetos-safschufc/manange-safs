// Tipos compartilhados da aplicação

export interface User {
  id: number;
  name: string;
  email: string;
  profile_id: number;
  profile_name?: string;
}

export interface CatalogoItem {
  id: number;
  master?: string;
  descricao_mat?: string;
  serv_aquisicao?: string;
  gr?: string;
  resp_controle?: string;
  resp_planj?: string;
  resp_almox?: string;
  resp_compra?: string;
  setor_controle?: string;
  setor_planj?: string;
  setor_almox?: string;
  setor_compra?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Funcionario {
  id_func: number;
  nome_func: string;
  setor_func: string;
  cargo?: string;
  status: string;
  created_at?: string;
}

export interface AccessProfile {
  id: number;
  profile_name: string;
  description?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

