import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Funcionario {
  id_func: number;
  nome_func: string;
  setor_func: string;
  cargo?: string;
  status: string;
}

interface FuncionarioState {
  funcionarios: Funcionario[];
  currentFuncionario: Funcionario | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: FuncionarioState = {
  funcionarios: [],
  currentFuncionario: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

// Thunk para listar funcionários
export const fetchFuncionarios = createAsyncThunk(
  'funcionario/fetchFuncionarios',
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
      
      const response = await api.get('/funcionarios', { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao buscar funcionários');
    }
  }
);

// Thunk para buscar funcionário por ID
export const fetchFuncionarioById = createAsyncThunk(
  'funcionario/fetchFuncionarioById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/funcionarios/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao buscar funcionário');
    }
  }
);

// Thunk para criar funcionário
export const createFuncionario = createAsyncThunk(
  'funcionario/createFuncionario',
  async (data: Partial<Funcionario>, { rejectWithValue }) => {
    try {
      console.log('📤 Enviando dados para criar funcionário:', data);
      const response = await api.post('/funcionarios', data);
      console.log('✅ Resposta do servidor:', response.data);
      return response.data.funcionario;
    } catch (error: any) {
      console.error('❌ Erro ao criar funcionário:', error);
      console.error('   Response:', error.response?.data);
      console.error('   Status:', error.response?.status);
      
      // Retorna erro mais detalhado
      const errorData = error.response?.data;
      
      // Trata erros de rede (sem resposta do servidor)
      if (!error.response) {
        console.error('   Erro de rede - servidor não respondeu');
        return rejectWithValue('Erro de conexão. Verifique se o servidor está rodando.');
      }
      
      if (errorData?.details && Array.isArray(errorData.details)) {
        return rejectWithValue({
          error: errorData.error || 'Erro ao criar funcionário',
          details: errorData.details,
        });
      }
      return rejectWithValue(errorData?.error || error.message || 'Erro ao criar funcionário');
    }
  }
);

// Thunk para atualizar funcionário
export const updateFuncionario = createAsyncThunk(
  'funcionario/updateFuncionario',
  async ({ id, data }: { id: number; data: Partial<Funcionario> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/funcionarios/${id}`, data);
      return response.data.funcionario;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao atualizar funcionário');
    }
  }
);

// Thunk para deletar funcionário
export const deleteFuncionario = createAsyncThunk(
  'funcionario/deleteFuncionario',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/funcionarios/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Erro ao deletar funcionário');
    }
  }
);

const funcionarioSlice = createSlice({
  name: 'funcionario',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuncionarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFuncionarios.fulfilled, (state, action) => {
        state.loading = false;
        state.funcionarios = action.payload.funcionarios;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFuncionarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFuncionarioById.fulfilled, (state, action) => {
        state.currentFuncionario = action.payload;
      })
      .addCase(createFuncionario.fulfilled, (state) => {
        // Recarrega a lista após criar
      })
      .addCase(updateFuncionario.fulfilled, (state, action) => {
        state.currentFuncionario = action.payload;
        const index = state.funcionarios.findIndex(f => f.id_func === action.payload.id_func);
        if (index !== -1) {
          state.funcionarios[index] = action.payload;
        }
      })
      .addCase(deleteFuncionario.fulfilled, (state, action) => {
        // Atualiza o status do funcionário na lista (soft delete)
        const index = state.funcionarios.findIndex(f => f.id_func === action.payload);
        if (index !== -1) {
          state.funcionarios[index].status = 'inativo';
        }
        // Se o funcionário deletado é o atual, atualiza também
        if (state.currentFuncionario?.id_func === action.payload) {
          state.currentFuncionario.status = 'inativo';
        }
      });
  },
});

export const { clearError } = funcionarioSlice.actions;
export default funcionarioSlice.reducer;

