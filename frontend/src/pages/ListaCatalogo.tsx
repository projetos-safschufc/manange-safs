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
  fetchCatalogo,
  deleteCatalogoItem,
} from '../store/slices/catalogSlice';
import { useIsAdmin } from '../hooks/useIsAdmin';
import api from '../services/api';

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

const ListaCatalogo = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const isAdmin = useIsAdmin();
  const { items, pagination, loading, error } = useSelector(
    (state: RootState) => state.catalog
  );

  // Inicializa filtros a partir da URL ou valores padrão
  const getInitialFilters = useCallback(() => {
    return {
      master: searchParams.get('master') || '',
      descricao_mat: searchParams.get('descricao_mat') || '',
      serv_aquisicao: searchParams.get('serv_aquisicao') || '',
      gr: searchParams.get('gr') || '',
      resp_controle: searchParams.get('resp_controle') || '',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(getInitialFilters);

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 12));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('limit') || '10', 12));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogoItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [itemToView, setItemToView] = useState<CatalogoItem | null>(null);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [servicosAquisicao, setServicosAquisicao] = useState<string[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado para controlar visibilidade das colunas (persistente no localStorage)
  const STORAGE_KEY = 'catalogo-column-visibility';
  
  // Função para carregar configuração de visibilidade do localStorage
  const loadColumnVisibility = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Erro ao carregar visibilidade de colunas do localStorage:', error);
    }
    // Retorna configuração padrão se não houver salva
    return {
      id: true,
      master: true,
      aghu_hu: false,
      aghu_me: false,
      catmat: false,
      ebserh: false,
      descricao_mat: true,
      apres: true,
      setor_controle: true,
      resp_controle: true,
      serv_aquisicao: true,
      hosp_demand: true,
      resp_planj: false,
      resp_fisc: false,
      resp_gest_tec: false,
      gr: true,
      ativo: false,
      actions: true,
    };
  }, []);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>(
    loadColumnVisibility
  );

  // Salva no localStorage quando a visibilidade mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibilityModel));
    } catch (error) {
      console.warn('Erro ao salvar visibilidade de colunas no localStorage:', error);
    }
  }, [columnVisibilityModel]);

  // Carrega grupos e serviços de aquisição para filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      // Carrega valores únicos de GR da tabela safs_catalogo
      try {
        const gruposResponse = await api.get('/catalogo/grupos-catalogo');
        console.log('📋 Resposta do endpoint grupos-catalogo:', gruposResponse.data);
        
        if (gruposResponse.data && Array.isArray(gruposResponse.data)) {
          const grValues: string[] = gruposResponse.data
            .filter((gr: string) => gr && gr.trim() !== '')
            .sort();
          console.log(`✅ Grupos do catálogo carregados: ${grValues.length}`, grValues);
          setGrupos(grValues);
        } else {
          console.warn('⚠️ Resposta do endpoint não é um array:', gruposResponse.data);
        }
      } catch (error: any) {
        console.error('Erro ao carregar grupos do catálogo:', error);
        // Não mostra toast para evitar spam de erros
        // Apenas loga o erro para debug
        if (error.response?.status !== 429) {
          const errorMessage = error.response?.data?.error || error.message || 'Erro ao carregar grupos';
          console.warn('Erro ao carregar grupos:', errorMessage);
        }
      }

      // Carrega serviços de aquisição únicos do endpoint específico
      try {
        const servicosResponse = await api.get('/catalogo/servicos-aquisicao');
        console.log('📋 Resposta do endpoint servicos-aquisicao:', servicosResponse.data);
        
        if (servicosResponse.data && Array.isArray(servicosResponse.data)) {
          const servicos: string[] = servicosResponse.data
            .filter((serv: string) => serv && serv.trim() !== '')
            .sort();
          console.log(`✅ Serviços de aquisição carregados: ${servicos.length}`, servicos);
          setServicosAquisicao(servicos);
        } else {
          console.warn('⚠️ Resposta do endpoint não é um array:', servicosResponse.data);
          // Se não for array, tenta processar como string única ou objeto
          if (servicosResponse.data) {
            const servicos = Array.isArray(servicosResponse.data) 
              ? servicosResponse.data 
              : [servicosResponse.data].filter(Boolean);
            setServicosAquisicao(servicos.filter((s: string) => s && s.trim() !== ''));
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar serviços de aquisição:', error);
        // Não mostra toast para evitar spam de erros
        // Apenas loga o erro para debug
        if (error.response?.status !== 429) {
          const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
          console.warn('Erro ao carregar serviços de aquisição:', errorMessage);
        }
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
      }

      // Limpa e constrói filtros para API
      const apiFilters = buildApiFilters(filtersToApply);

      // Atualiza URL com filtros
      updateUrlFilters(filtersToApply);

      await dispatch(
        fetchCatalogo({
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
        fetchCatalogo({
          page: 1,
          limit: pageSize,
          filters: {},
        })
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega dados quando página/tamanho muda (mantendo filtros atuais)
  useEffect(() => {
    if (filtersApplied || page > 1 || pageSize !== 12) {
      const apiFilters = buildApiFilters(filters);
      dispatch(
        fetchCatalogo({
          page,
          limit: pageSize,
          filters: apiFilters,
        })
      );
    }
  }, [page, pageSize, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aplica filtros quando mudam (com debounce para campos de texto, imediato para dropdowns)
  useEffect(() => {
    if (filtersApplied) {
      // Limpa timer anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Para campos de texto, aplica com debounce
      const hasTextFilters = filters.master.trim() !== '' || filters.descricao_mat.trim() !== '' || filters.resp_controle.trim() !== '';
      
      // Para dropdowns (serv_aquisicao, gr), aplica imediatamente quando há valor selecionado
      const hasDropdownFilters = (filters.serv_aquisicao && filters.serv_aquisicao.trim() !== '') || 
                                  (filters.gr && filters.gr.trim() !== '');
      
      // Verifica se há algum filtro ativo
      const hasAnyFilters = hasTextFilters || hasDropdownFilters;
      
      if (hasTextFilters) {
        debounceTimer.current = setTimeout(() => {
          setPage(1);
          applyFilters(filters, 1);
        }, 500); // 500ms de debounce
      } else if (hasDropdownFilters) {
        // Para dropdowns, aplica imediatamente quando há valor selecionado
        setPage(1);
        applyFilters(filters, 1);
      } else if (!hasAnyFilters && filtersApplied) {
        // Se não há filtros e estava aplicado, limpa os filtros
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
      // Se é um dropdown (serv_aquisicao, gr), marca como aplicado
      if (field === 'serv_aquisicao' || field === 'gr') {
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
      master: '',
      descricao_mat: '',
      serv_aquisicao: '',
      gr: '',
      resp_controle: '',
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
      fetchCatalogo({
        page: 1,
        limit: pageSize,
        filters: {},
      })
    );
  };

  // Verifica se há filtros ativos usando utilitário
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFiltersValue = useMemo(() => hasActiveFilters(filters), [filters]);

  const handleDelete = (item: CatalogoItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await dispatch(deleteCatalogoItem(itemToDelete.id)).unwrap();
        toast.success('Item deletado com sucesso!');
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        // Recarrega a lista
        const activeFilters: any = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            activeFilters[key] = value.trim();
          }
        });
        await dispatch(
          fetchCatalogo({
            page,
            limit: pageSize,
            filters: activeFilters,
          })
        );
      } catch (error: any) {
        toast.error(error || 'Erro ao deletar item');
      }
    }
  };

  const handleView = async (item: CatalogoItem) => {
    try {
      const response = await api.get(`/catalogo/${item.id}`);
      setItemToView(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes do item');
    }
  };

  const handleEdit = (item: CatalogoItem) => {
    navigate(`/editar-catalogo/${item.id}`);
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      minWidth: 80,
      type: 'number',
    },
    {
      field: 'master',
      headerName: 'Master',
      width: 80,
      minWidth: 80,
    },
    {
      field: 'aghu_hu',
      headerName: 'AGHU HU',
      width: 100,
      minWidth: 100,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'aghu_me',
      headerName: 'AGHU ME',
      width: 80,
      minWidth: 80,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'catmat',
      headerName: 'Catmat',
      width: 80,
      minWidth: 80,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'ebserh',
      headerName: 'EBSERH',
      width: 80,
      minWidth: 80,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'descricao_mat',
      headerName: 'Descrição',
      width: 400,
      minWidth: 400,
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            width: '100%',
          }}
          title={params.value}
        >
          {params.value || '-'}
        </Box>
      ),
    },
    {
      field: 'apres',
      headerName: 'Apres',
      width: 60,
      minWidth: 60,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'setor_controle',
      headerName: 'Setor',
      width: 90,
      minWidth: 90,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'resp_controle',
      headerName: 'Resp. Ctrl',
      width: 120,
      minWidth: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" color="primary" variant="outlined" />
        ) : (
          '-'
        ),
    },
    {
      field: 'serv_aquisicao',
      headerName: 'Serv. Aquisição',
      width: 300,
      minWidth: 300,
      align: 'left',
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'hosp_demand',
      headerName: 'Hosp. Demand',
      width: 100,
      minWidth: 100,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'resp_planj',
      headerName: 'Resp. Planej.',
      width: 120,
      minWidth: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" color="secondary" variant="outlined" />
        ) : (
          '-'
        ),
    },
    {
      field: 'resp_fisc',
      headerName: 'Resp. Fisc.',
      width: 120,
      minWidth: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'resp_gest_tec',
      headerName: 'Resp. Gest. Téc.',
      width: 120,
      minWidth: 100,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'gr',
      headerName: 'GR',
      width: 80,
      minWidth: 80,
    },
    {
      field: 'ativo',
      headerName: 'Ativo',
      width: 90,
      minWidth: 90,
      type: 'boolean',
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Sim' : 'Não'}
          size="small"
          color={params.value ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 80,
      minWidth: 80,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      resizable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="Visualizar"
          onClick={() => handleView(params.row)}
          showInMenu
        />,
        ...(isAdmin ? [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Editar"
            onClick={() => handleEdit(params.row)}
            showInMenu
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Deletar"
            onClick={() => handleDelete(params.row)}
            showInMenu
            color="error"
          />,
        ] : []),
      ],
    },
  ], [isAdmin]);

  return (
    <Container maxWidth={false} disableGutters sx={{ width: '90%', maxWidth: '100%', px: 0, margin: 0 }}>
      <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Catálogo de Materiais
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cadastrar-catalogo')}
          >
            Novo Item
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Master"
                value={filters.master}
                onChange={(e) => handleTextFilterChange('master', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
                size="small"
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
              <TextField
                fullWidth
                label="Descrição"
                value={filters.descricao_mat}
                onChange={(e) => handleTextFilterChange('descricao_mat', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Serv. Aquisição</InputLabel>
                <Select
                  value={filters.serv_aquisicao}
                  label="Serv. Aquisição"
                  onChange={(e) => handleFilterChange('serv_aquisicao', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {servicosAquisicao.map((serv) => (
                    <MenuItem key={serv} value={serv}>
                      {serv}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>GR</InputLabel>
                <Select
                  value={filters.gr}
                  label="GR"
                  onChange={(e) => handleFilterChange('gr', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {grupos.map((gr) => (
                    <MenuItem key={gr} value={gr}>
                      {gr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Resp. Controle"
                value={filters.resp_controle}
                onChange={(e) => handleTextFilterChange('resp_controle', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
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
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={!hasActiveFiltersValue}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleApplyFilters}
              >
                Filtrar
              </Button>
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
          <Box 
            sx={{ 
              height: 800, 
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '100%',
                overflowX: 'auto',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  height: '12px',
                  width: '12px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  },
                },
              }}
            >
              <DataGrid
                rows={items}
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
                getRowId={(row) => row.id}
                getRowHeight={() => 'auto'}
                getEstimatedRowHeight={() => 52}
                localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                slots={{
                  toolbar: GridToolbar,
                }}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) => {
                  setColumnVisibilityModel(newModel);
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    fontSize: '0.875rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    padding: '8px 16px',
                    minWidth: 'fit-content',
                    '&:focus': {
                      outline: 'none',
                    },
                    '&:focus-within': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      overflow: 'visible',
                      textOverflow: 'clip',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    },
                  },
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    overflow: 'visible',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  '& .MuiDataGrid-columnHeaderTitleContainerContent': {
                    overflow: 'visible',
                    width: '100%',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    borderBottom: '2px solid rgba(224, 224, 224, 1)',
                    overflow: 'visible',
                  },
                  '& .MuiDataGrid-columnHeadersInner': {
                    overflow: 'visible',
                    minWidth: 'max-content',
                  },
                  '& .MuiDataGrid-actionsColumnHeader': {
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 600,
                    },
                  },
                  '& .MuiDataGrid-actionsCell': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0px',
                    padding: '4px',
                    minWidth: '100px',
                    width: '100px',
                  },
                  '& .MuiDataGrid-cell--textLeft': {
                    justifyContent: 'center',
                  },
                  '& .MuiDataGrid-menuIcon': {
                    visibility: 'visible !important',
                    display: 'block !important',
                  },
                  '& .MuiDataGrid-menuIconButton': {
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    display: 'flex !important',
                    padding: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  },
                  '& .MuiDataGrid-actionsCell button': {
                    minWidth: 'auto',
                    padding: '4px 8px',
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  },
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-main': {
                    overflow: 'visible',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflow: 'visible',
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    minWidth: 'max-content',
                  },
                }}
              />
            </Box>
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
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o item <strong>{itemToDelete?.master || itemToDelete?.id}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Excluir
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
        <DialogTitle>Detalhes do Item</DialogTitle>
        <DialogContent>
          {itemToView && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1">{itemToView.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Master
                </Typography>
                <Typography variant="body1">{itemToView.master || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Descrição
                </Typography>
                <Typography variant="body1">{itemToView.descricao_mat || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Serviço de Aquisição
                </Typography>
                <Typography variant="body1">{itemToView.serv_aquisicao || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  GR
                </Typography>
                <Typography variant="body1">{itemToView.gr || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Responsável Controle
                </Typography>
                <Typography variant="body1">{itemToView.resp_controle || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Setor Controle
                </Typography>
                <Typography variant="body1">{itemToView.setor_controle || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Responsável Planejamento
                </Typography>
                <Typography variant="body1">{itemToView.resp_planj || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Setor Planejamento
                </Typography>
                <Typography variant="body1">{itemToView.setor_planj || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Responsável Almoxarifado
                </Typography>
                <Typography variant="body1">{itemToView.resp_almox || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Setor Almoxarifado
                </Typography>
                <Typography variant="body1">{itemToView.setor_almox || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Responsável Compra
                </Typography>
                <Typography variant="body1">{itemToView.resp_compra || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Setor Compra
                </Typography>
                <Typography variant="body1">{itemToView.setor_compra || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data de Criação
                </Typography>
                <Typography variant="body1">
                  {itemToView.created_at
                    ? new Date(itemToView.created_at).toLocaleString('pt-BR')
                    : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Última Atualização
                </Typography>
                <Typography variant="body1">
                  {itemToView.updated_at
                    ? new Date(itemToView.updated_at).toLocaleString('pt-BR')
                    : '-'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          {itemToView && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                handleEdit(itemToView);
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

export default ListaCatalogo;

