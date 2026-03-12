import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hasActiveFilters, countActiveFilters, buildApiFilters, validateFilters } from '../utils/filterUtils';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  InputAdornment,
  Pagination,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbar,
} from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchFuncionarios,
} from '../store/slices/funcionarioSlice';
import { useIsAdmin } from '../hooks/useIsAdmin';
import api from '../services/api';

interface Funcionario {
  id_func: number;
  nome_func: string;
  setor_func: string;
  cargo?: string;
  status: string;
  created_at?: string;
}

const ListaFuncionarios = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const isAdmin = useIsAdmin();
  const { funcionarios, pagination, loading, error } = useSelector(
    (state: RootState) => state.funcionario
  );

  // Inicializa filtros a partir da URL ou valores padrão
  const getInitialFilters = useCallback(() => {
    return {
      nome: searchParams.get('nome') || '',
      setor: searchParams.get('setor') || '',
      cargo: searchParams.get('cargo') || '',
      status: searchParams.get('status') || '',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(getInitialFilters);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<Funcionario | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [funcionarioToView, setFuncionarioToView] = useState<Funcionario | null>(null);
  const [setores, setSetores] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proteção: redireciona usuários não-admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Carrega setores e cargos únicos para filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const funcionariosResponse = await api.get('/funcionarios', {
          params: { limit: 1000 },
        });
        if (funcionariosResponse.data?.funcionarios) {
          const setoresList: string[] = funcionariosResponse.data.funcionarios
            .map((f: Funcionario) => f.setor_func)
            .filter((setor: string) => setor)
            .sort();
          setSetores([...new Set(setoresList)]);

          const cargosList: string[] = funcionariosResponse.data.funcionarios
            .map((f: Funcionario) => f.cargo)
            .filter((cargo: string | undefined): cargo is string => Boolean(cargo))
            .sort();
          setCargos([...new Set(cargosList)]);
        }
      } catch (error) {
        console.error('Erro ao carregar opções de filtro:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Atualiza URL com filtros ativos
  const updateUrlFilters = useCallback((filtersToUpdate: typeof filters) => {
    const apiFilters = buildApiFilters(filtersToUpdate);
    const newSearchParams = new URLSearchParams();
    
    Object.entries(apiFilters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      }
    });
    
    setSearchParams(newSearchParams, { replace: true });
  }, [setSearchParams]);

  // Função para aplicar filtros com validação
  const applyFilters = useCallback(async (filtersToApply: typeof filters, pageToUse: number = 1) => {
    try {
      // Valida filtros
      const validation = validateFilters(filtersToApply);
      if (!validation.valid) {
        console.warn('Filtros inválidos:', validation.errors);
        // Continua mesmo com avisos, mas pode mostrar toast se necessário
      }

      // Limpa e constrói filtros para API
      const apiFilters = buildApiFilters(filtersToApply);

      // Atualiza URL com filtros
      updateUrlFilters(filtersToApply);

      await dispatch(
        fetchFuncionarios({
          page: pageToUse,
          limit: pageSize,
          filters: apiFilters,
        })
      ).unwrap();
    } catch (error: any) {
      console.error('Erro ao aplicar filtros:', error);
      toast.error(error || 'Erro ao aplicar filtros');
    }
  }, [dispatch, pageSize, updateUrlFilters]);

  // Carrega filtros da URL ao montar o componente
  useEffect(() => {
    const urlFilters = getInitialFilters();
    const hasUrlFilters = hasActiveFilters(urlFilters);
    
    if (hasUrlFilters) {
      setFilters(urlFilters);
      setFiltersApplied(true);
      // Aplica filtros da URL imediatamente
      applyFilters(urlFilters, 1);
    } else {
      // Carrega dados iniciais sem filtros
      dispatch(
        fetchFuncionarios({
          page: 1,
          limit: pageSize,
          filters: {},
        })
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega dados quando página/tamanho muda (mantendo filtros atuais)
  useEffect(() => {
    // Só executa se não for o carregamento inicial (que já foi tratado acima)
    if (filtersApplied || page > 1 || pageSize !== 10) {
      const apiFilters = buildApiFilters(filters);
      dispatch(
        fetchFuncionarios({
          page,
          limit: pageSize,
          filters: apiFilters,
        })
      );
    }
  }, [page, pageSize, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aplica filtros quando mudam (com debounce para campos de texto)
  useEffect(() => {
    if (filtersApplied) {
      // Limpa timer anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Para campos de texto, aplica com debounce
      const hasTextFilters = filters.nome.trim() !== '';
      
      if (hasTextFilters) {
        debounceTimer.current = setTimeout(() => {
          setPage(1);
          applyFilters(filters, 1);
        }, 500); // 500ms de debounce
      } else if (filters.setor || filters.cargo || filters.status) {
        // Para dropdowns, aplica imediatamente
        setPage(1);
        applyFilters(filters, 1);
      }

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [filters, filtersApplied]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Se é um dropdown (setor, cargo, status), aplica imediatamente
      if (field === 'setor' || field === 'cargo' || field === 'status') {
        setFiltersApplied(true);
      }
      return newFilters;
    });
  };

  const handleTextFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setFiltersApplied(true);
  };

  const handleApplyFilters = async () => {
    setFiltersApplied(true);
    setPage(1);
    await applyFilters(filters, 1);
  };

  const handleClearFilters = async () => {
    const clearedFilters = {
      nome: '',
      setor: '',
      cargo: '',
      status: '',
    };
    setFilters(clearedFilters);
    setFiltersApplied(false);
    setPage(1);
    
    // Limpa timer de debounce se existir
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    // Limpa filtros da URL
    setSearchParams({}, { replace: true });
    
    await dispatch(
      fetchFuncionarios({
        page: 1,
        limit: pageSize,
        filters: {},
      })
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Verifica se há filtros ativos usando utilitário
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFiltersValue = useMemo(() => hasActiveFilters(filters), [filters]);

  const handleDelete = (funcionario: Funcionario) => {
    setFuncionarioToDelete(funcionario);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (funcionarioToDelete) {
      try {
        // Usa toggle status para alternar entre ativo/inativo
        await api.patch(`/funcionarios/${funcionarioToDelete.id_func}/toggle-status`);
        toast.success(
          `Funcionário ${funcionarioToDelete.status === 'ativo' ? 'desativado' : 'ativado'} com sucesso!`
        );
        setDeleteDialogOpen(false);
        setFuncionarioToDelete(null);
        // Recarrega a lista
        const activeFilters: any = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            activeFilters[key] = value.trim();
          }
        });
        await dispatch(
          fetchFuncionarios({
            page,
            limit: pageSize,
            filters: activeFilters,
          })
        );
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Erro ao alterar status do funcionário');
      }
    }
  };

  const handleView = async (funcionario: Funcionario) => {
    try {
      const response = await api.get(`/funcionarios/${funcionario.id_func}`);
      setFuncionarioToView(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes do funcionário');
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    navigate(`/editar-funcionario/${funcionario.id_func}`);
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id_func',
      headerName: 'ID',
      width: 80,
      type: 'number',
    },
    {
      field: 'nome_func',
      headerName: 'Nome',
      width: 250,
      flex: 1,
    },
    {
      field: 'setor_func',
      headerName: 'Setor',
      width: 200,
      flex: 0.8,
    },
    {
      field: 'cargo',
      headerName: 'Cargo',
      width: 200,
      flex: 0.8,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Chip
          label={params.value === 'ativo' ? 'Ativo' : 'Inativo'}
          color={params.value === 'ativo' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="Visualizar"
          onClick={() => handleView(params.row)}
          showInMenu
        />,
        ...(isAdmin ? [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Editar"
            onClick={() => handleEdit(params.row)}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label={params.row.status === 'ativo' ? 'Desativar' : 'Ativar'}
            onClick={() => handleDelete(params.row)}
            showInMenu
            color={params.row.status === 'ativo' ? 'error' : 'success'}
          />,
        ] : []),
      ],
    },
  ], [isAdmin]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Funcionários
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cadastrar-funcionario')}
          >
            Novo Funcionário
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Filtros
            </Typography>
            {hasActiveFiltersValue && (
              <Tooltip title="Clique para limpar todos os filtros">
                <Chip
                  label={`${activeFiltersCount} filtro(s) ativo(s)`}
                  color="primary"
                  size="small"
                  onDelete={handleClearFilters}
                  deleteIcon={<ClearIcon />}
                />
              </Tooltip>
            )}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Nome"
                value={filters.nome}
                onChange={(e) => handleTextFilterChange('nome', e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                placeholder="Digite para buscar..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Setor</InputLabel>
                <Select
                  value={filters.setor}
                  label="Setor"
                  onChange={(e) => handleFilterChange('setor', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {setores.map((setor) => (
                    <MenuItem key={setor} value={setor}>
                      {setor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={filters.cargo}
                  label="Cargo"
                  onChange={(e) => handleFilterChange('cargo', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {cargos.map((cargo) => (
                    <MenuItem key={cargo} value={cargo}>
                      {cargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
              {hasActiveFiltersValue && (
                <Chip
                  label={`${activeFiltersCount} filtro(s) ativo(s)`}
                  color="primary"
                  size="small"
                  onDelete={handleClearFilters}
                  deleteIcon={<ClearIcon />}
                />
              )}
              <Tooltip title="Limpar todos os filtros">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    disabled={!hasActiveFiltersValue}
                  >
                    Limpar
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Aplicar filtros manualmente (ou pressione Enter no campo Nome)">
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleApplyFilters}
                >
                  Filtrar
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={funcionarios}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={{
                page: page - 1,
                pageSize: pageSize,
              }}
              onPaginationModelChange={(model) => {
                setPageSize(model.pageSize);
                setPage(model.page + 1);
              }}
              paginationMode="server"
              rowCount={pagination.total}
              getRowId={(row) => row.id_func}
              localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
              slots={{
                toolbar: GridToolbar,
              }}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total de registros: {pagination.total}
            </Typography>
            <Pagination
              count={pagination.totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar {funcionarioToDelete?.status === 'ativo' ? 'Desativação' : 'Ativação'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja {funcionarioToDelete?.status === 'ativo' ? 'desativar' : 'ativar'} o funcionário{' '}
            <strong>{funcionarioToDelete?.nome_func}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmDelete}
            color={funcionarioToDelete?.status === 'ativo' ? 'error' : 'success'}
            variant="contained"
          >
            {funcionarioToDelete?.status === 'ativo' ? 'Desativar' : 'Ativar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de visualização */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Funcionário</DialogTitle>
        <DialogContent>
          {funcionarioToView && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1">{funcionarioToView.id_func}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={funcionarioToView.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  color={funcionarioToView.status === 'ativo' ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nome
                </Typography>
                <Typography variant="body1">{funcionarioToView.nome_func}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Setor
                </Typography>
                <Typography variant="body1">{funcionarioToView.setor_func}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cargo
                </Typography>
                <Typography variant="body1">{funcionarioToView.cargo || '-'}</Typography>
              </Grid>
              {funcionarioToView.created_at && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Data de Cadastro
                  </Typography>
                  <Typography variant="body1">
                    {new Date(funcionarioToView.created_at).toLocaleString('pt-BR')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          {funcionarioToView && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                handleEdit(funcionarioToView);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListaFuncionarios;

