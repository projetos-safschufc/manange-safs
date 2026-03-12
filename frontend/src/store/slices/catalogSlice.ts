import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface CatalogoItem {
  id: number;
  master?: string;
  aghu_hu?: string;
  aghu_me?: string;
  catmat?: string;
  ebserh?: string;
  descricao_mat?: string;
  apres?: string;
  setor_controle?: string;
  resp_controle?: string;
  serv_aquisicao?: string;
  hosp_demand?: string;
  resp_planj?: string;
  resp_fisc?: string;
  resp_gest_tec?: string;
  gr?: string;
  ativo?: boolean;
  resp_almox?: string;
  resp_compra?: string;
  setor_planj?: string;
  setor_almox?: string;
  setor_compra?: string;
  created_at?: string;
  updated_at?: string;
}

interface CatalogState {
  items: CatalogoItem[];
  currentItem: CatalogoItem | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  items: [],
  currentItem: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

// Thunk para listar catálogo
export const fetchCatalogo = createAsyncThunk(
  'catalog/fetchCatalogo',
  async (params: { page?: number; limit?: number; filters?: any }, { rejectWithValue }) => {
    try {
      // Constrói query params corretamente - filtros diretos, não aninhados
      const queryParams: any = {
        page: params.page || 1,
        limit: params.limit || 10,
      };
      
      // Adiciona filtros diretamente como query params
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value && value !== '') {
            queryParams[key] = value;
          }
        });
      }
      
      const response = await api.get('/catalogo', { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao buscar catálogo');
    }
  }
);

// Thunk para buscar item por ID
export const fetchCatalogoById = createAsyncThunk(
  'catalog/fetchCatalogoById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/catalogo/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao buscar item');
    }
  }
);

// Thunk para criar item
export const createCatalogoItem = createAsyncThunk(
  'catalog/createCatalogoItem',
  async (data: Partial<CatalogoItem>, { rejectWithValue }) => {
    try {
      const response = await api.post('/catalogo', data);
      return response.data.catalogo;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao criar item');
    }
  }
);

// Thunk para atualizar item
export const updateCatalogoItem = createAsyncThunk(
  'catalog/updateCatalogoItem',
  async ({ id, data }: { id: number; data: Partial<CatalogoItem> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/catalogo/${id}`, data);
      return response.data.catalogo;
    } catch (error: any) {
      // Retorna erro mais detalhado se disponível
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        return rejectWithValue({
          error: errorData.error || 'Erro ao atualizar item',
          details: errorData.details,
        });
      }
      return rejectWithValue(errorData?.error || error.message || 'Erro ao atualizar item');
    }
  }
);

// Thunk para deletar item
export const deleteCatalogoItem = createAsyncThunk(
  'catalog/deleteCatalogoItem',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/catalogo/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao deletar item');
    }
  }
);

// Thunk para atribuir responsabilidade
export const atribuirResponsabilidade = createAsyncThunk(
  'catalog/atribuirResponsabilidade',
  async (params: { tipo: string; funcionario_id: number; filtro: any }, { rejectWithValue }) => {
    try {
      const response = await api.post('/catalogo/atribuir-responsabilidade', params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao atribuir responsabilidade');
    }
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setCurrentItem: (state, action: PayloadAction<CatalogoItem | null>) => {
      state.currentItem = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogo.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.catalogo;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCatalogo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCatalogoById.fulfilled, (state, action) => {
        state.currentItem = action.payload;
      })
      .addCase(createCatalogoItem.fulfilled, () => {
        // Recarrega a lista após criar
      })
      .addCase(updateCatalogoItem.fulfilled, (state, action) => {
        state.currentItem = action.payload;
        // Atualiza na lista também
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteCatalogoItem.fulfilled, (state, action) => {
        // Remove o item da lista
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentItem?.id === action.payload) {
          state.currentItem = null;
        }
        // Atualiza o total
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });
  },
});

export const { setCurrentItem, clearError } = catalogSlice.actions;
export default catalogSlice.reducer;

