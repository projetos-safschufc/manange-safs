import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Pagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../store/store';
import { fetchFuncionarios } from '../store/slices/funcionarioSlice';
import api from '../services/api';

interface CatalogoItem {
  id: number;
  master?: string | null;
  descricao_mat?: string | null;
  apres?: string | null;
  setor_controle?: string | null;
  resp_controle?: string | null;
  serv_aquisicao?: string | null;
  gr?: string | null;
}

const AtribuirResponsabilidade = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { funcionarios } = useSelector((state: RootState) => state.funcionario);

  // Estados para filtros
  const [filters, setFilters] = useState({
    master: '',
    descricao_mat: '',
    serv_aquisicao: '',
    resp_controle: '',
  });

  // Estados para dados da tabela
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(13);

  // Estados para seleção e edição
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [respControleValues, setRespControleValues] = useState<Record<number, string>>({});
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>('');

  // Estados para opções de filtros
  const [servicosAquisicao, setServicosAquisicao] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Debounce para filtros de texto
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega funcionários ao montar o componente
  useEffect(() => {
    dispatch(fetchFuncionarios({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // Carrega opções de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        // Carrega serviços de aquisição
        try {
          const servicosResponse = await api.get('/catalogo/servicos-aquisicao');
          if (Array.isArray(servicosResponse.data)) {
            setServicosAquisicao(servicosResponse.data);
          }
        } catch (error) {
          console.error('Erro ao carregar serviços de aquisição:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar opções de filtro:', error);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Função para buscar dados com filtros
  const fetchData = useCallback(async (currentPage: number, currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      // Adiciona filtros apenas se não estiverem vazios
      if (currentFilters.master.trim()) {
        params.master = currentFilters.master.trim();
      }
      if (currentFilters.descricao_mat.trim()) {
        params.descricao_mat = currentFilters.descricao_mat.trim();
      }
      if (currentFilters.serv_aquisicao) {
        params.serv_aquisicao = currentFilters.serv_aquisicao;
      }
      if (currentFilters.resp_controle) {
        params.resp_controle = currentFilters.resp_controle;
      }

      const response = await api.get('/catalogo', { params });
      
      if (response.data && response.data.catalogo) {
        setItems(response.data.catalogo);
        setTotalRecords(response.data.pagination?.total || 0);
        
        // Inicializa valores de resp_controle com os valores existentes
        const initialValues: Record<number, string> = {};
        response.data.catalogo.forEach((item: CatalogoItem) => {
          if (item.resp_controle) {
            initialValues[item.id] = item.resp_controle;
          }
        });
        setRespControleValues(prev => ({ ...prev, ...initialValues }));
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Carrega dados iniciais
  useEffect(() => {
    fetchData(page, filters);
  }, [page]);

  // Debounce para filtros de texto
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(1); // Reset para primeira página ao filtrar
      fetchData(1, filters);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters.master, filters.descricao_mat]);

  // Aplica filtros imediatamente para dropdowns
  useEffect(() => {
    setPage(1);
    fetchData(1, filters);
  }, [filters.serv_aquisicao, filters.resp_controle]);

  // Manipula mudança de filtros
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    setFilters({
      master: '',
      descricao_mat: '',
      serv_aquisicao: '',
      resp_controle: '',
    });
    setPage(1);
    setSelectedIds(new Set());
    setRespControleValues({});
    setSelectedFuncionarioId('');
  };

  // Manipula seleção de checkbox
  const handleCheckboxChange = (itemId: number, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(itemId);
      // Se não houver valor, inicializa com string vazia
      if (!respControleValues[itemId]) {
        setRespControleValues(prev => ({ ...prev, [itemId]: '' }));
      }
    } else {
      newSelectedIds.delete(itemId);
      // Remove o valor quando desmarcar
      setRespControleValues(prev => {
        const newValues = { ...prev };
        delete newValues[itemId];
        return newValues;
      });
    }
    setSelectedIds(newSelectedIds);
  };

  // Manipula mudança no campo Resp. Ctrl
  const handleRespControleChange = (itemId: number, value: string) => {
    setRespControleValues(prev => ({ ...prev, [itemId]: value }));
  };

  // Manipula seleção de funcionário no select-box inferior
  const handleFuncionarioSelect = (funcionarioId: string) => {
    setSelectedFuncionarioId(funcionarioId);
    
    if (!funcionarioId) {
      return;
    }

    const funcionario = funcionarios.find(f => f.id_func === parseInt(funcionarioId));
    if (!funcionario) {
      return;
    }

    // Preenche todos os campos Resp. Ctrl das linhas selecionadas
    const newValues: Record<number, string> = { ...respControleValues };
    selectedIds.forEach(id => {
      newValues[id] = funcionario.nome_func;
    });
    setRespControleValues(newValues);
  };

  // Seleciona / desseleciona todos os itens da página atual (respeitando os filtros)
  const areAllCurrentPageSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAllCurrentPage = (checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    const newRespValues: Record<number, string> = { ...respControleValues };

    if (checked) {
      items.forEach((item) => {
        newSelectedIds.add(item.id);
        if (newRespValues[item.id] === undefined) {
          newRespValues[item.id] = '';
        }
      });
    } else {
      items.forEach((item) => {
        newSelectedIds.delete(item.id);
        if (newRespValues[item.id] !== undefined) {
          delete newRespValues[item.id];
        }
      });
    }

    setSelectedIds(newSelectedIds);
    setRespControleValues(newRespValues);
  };

  // Manipula mudança de página
  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    // Mantém seleções ao mudar de página (opcional - pode ser removido se necessário)
    // setSelectedIds(new Set());
  };

  // Salva alterações
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos um material para atualizar');
      return;
    }

    // Valida se todos os selecionados têm valor de resp_controle
    const idsToUpdate: number[] = [];
    const updateData: Record<number, { resp_controle: string; setor_controle?: string | null }> = {};

    selectedIds.forEach(id => {
      const respControle = respControleValues[id]?.trim();
      if (respControle) {
        idsToUpdate.push(id);
        
        // Busca o funcionário para obter o setor
        const funcionario = funcionarios.find(f => f.nome_func === respControle);
        updateData[id] = {
          resp_controle: respControle,
          setor_controle: funcionario?.setor_func || null,
        };
      }
    });

    if (idsToUpdate.length === 0) {
      toast.warning('Preencha o campo "Resp. Ctrl" para os materiais selecionados');
      return;
    }

    try {
      setLoading(true);
      
      // Agrupa por valores únicos para otimizar atualizações
      const updatesByValue: Record<string, number[]> = {};
      idsToUpdate.forEach(id => {
        const respControle = updateData[id].resp_controle;
        if (!updatesByValue[respControle]) {
          updatesByValue[respControle] = [];
        }
        updatesByValue[respControle].push(id);
      });

      // Executa atualizações em lote
      const updatePromises = Object.entries(updatesByValue).map(async ([respControle, ids]) => {
        const funcionario = funcionarios.find(f => f.nome_func === respControle);
        const updatePayload = {
          resp_controle: respControle,
          setor_controle: funcionario?.setor_func || null,
        };
        
        return api.post('/catalogo/update-multiple', {
          ids,
          updateData: updatePayload,
        });
      });

      await Promise.all(updatePromises);

      toast.success(`${idsToUpdate.length} material(is) atualizado(s) com sucesso!`);
      
      // Limpa seleções e recarrega dados
      setSelectedIds(new Set());
      setRespControleValues({});
      setSelectedFuncionarioId('');
      fetchData(page, filters);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  // Cancela alterações
  const handleCancel = () => {
    setSelectedIds(new Set());
    setRespControleValues({});
    setSelectedFuncionarioId('');
    // Recarrega dados para restaurar valores originais
    fetchData(page, filters);
  };

  const funcionariosAtivos = funcionarios.filter(
    (f) => f.status === 'ativo' && (f.setor_func === 'UACE' || f.setor_func === 'ULOG')
  );

  return (
    <Container maxWidth={false} sx={{ width: '90%', maxWidth: '100%', px: 0, margin: 0 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Atribuir Responsabilidade a Materiais
      </Typography>

      {/* Filtros Superiores */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Master"
                value={filters.master}
                onChange={(e) => handleFilterChange('master', e.target.value)}
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
                onChange={(e) => handleFilterChange('descricao_mat', e.target.value)}
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
              <FormControl fullWidth>
                <InputLabel>Serv. Aquisição</InputLabel>
                <Select
                  value={filters.serv_aquisicao}
                  onChange={(e) => handleFilterChange('serv_aquisicao', e.target.value)}
                  label="Serv. Aquisição"
                  disabled={loadingFilters}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {servicosAquisicao.map((servico) => (
                    <MenuItem key={servico} value={servico}>
                      {servico}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Resp. Ctrl</InputLabel>
                <Select
                  value={filters.resp_controle}
                  onChange={(e) => handleFilterChange('resp_controle', e.target.value)}
                  label="Resp. Ctrl"
                  disabled={loadingFilters}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {funcionariosAtivos.map((funcionario) => (
                    <MenuItem key={funcionario.id_func} value={funcionario.nome_func}>
                      {funcionario.nome_func}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={() => {
                  setPage(1);
                  fetchData(1, filters);
                }}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Materiais */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: 1000, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" style={{ width: 50 }}>
                    <Checkbox
                      indeterminate={selectedIds.size > 0 && !areAllCurrentPageSelected}
                      checked={areAllCurrentPageSelected}
                      onChange={(e) => handleToggleSelectAllCurrentPage(e.target.checked)}
                      inputProps={{ 'aria-label': 'Selecionar todos os materiais da página atual' }}
                    />
                  </TableCell>
                  <TableCell style={{ minWidth: 100 }}>Master</TableCell>
                  <TableCell style={{ minWidth: 300 }}>Descrição</TableCell>
                  <TableCell style={{ minWidth: 80 }}>Apres</TableCell>
                  <TableCell style={{ minWidth: 100 }}>Setor</TableCell>
                  <TableCell style={{ minWidth: 200 }}>Resp. Ctrl</TableCell>
                  <TableCell style={{ minWidth: 120 }}>Serv. Aquisição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nenhum material encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{item.master || '-'}</TableCell>
                        <TableCell>{item.descricao_mat || '-'}</TableCell>
                        <TableCell>{item.apres || '-'}</TableCell>
                        <TableCell>{item.setor_controle || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={respControleValues[item.id] || ''}
                            onChange={(e) => handleRespControleChange(item.id, e.target.value)}
                            disabled={!isSelected}
                            placeholder={isSelected ? 'Digite o responsável' : 'Selecione a linha'}
                          />
                        </TableCell>
                        <TableCell>{item.serv_aquisicao || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação e Contador */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total de registros: {totalRecords}
            </Typography>
            <Pagination
              count={Math.ceil(totalRecords / pageSize)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </CardContent>
      </Card>

      {/* Select-Box Inferior e Botões */}
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Resp. Controle</InputLabel>
                <Select
                  value={selectedFuncionarioId}
                  onChange={(e) => handleFuncionarioSelect(e.target.value)}
                  label="Resp. Controle"
                >
                  <MenuItem value="">
                    <em>Selecione um funcionário</em>
                  </MenuItem>
                  {funcionariosAtivos.map((funcionario) => (
                    <MenuItem key={funcionario.id_func} value={funcionario.id_func.toString()}>
                      {funcionario.nome_func} - {funcionario.setor_func}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading || selectedIds.size === 0}
              >
                {loading ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AtribuirResponsabilidade;
