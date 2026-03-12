import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import api from '../services/api';
import { RootState } from '../store/store';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface User {
  id: number;
  name: string;
  email: string;
  profile_id: number;
  profile_name?: string;
  status: string;
  created_at: string;
}

interface AccessProfile {
  id: number;
  profile_name: string;
  description?: string;
}

const GestaoUsuarios = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'inativo' | 'all'>('ativo');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    profile_id: '',
    status: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Verifica se é ADMIN usando hook personalizado
  const isAdmin = useIsAdmin();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter === 'all' ? 'all' : statusFilter,
        },
      });
      setUsers(response.data.users || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 1,
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  const loadProfiles = useCallback(async () => {
    try {
      const response = await api.get('/users/profiles');
      setProfiles(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar perfis');
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/dashboard');
      return;
    }
    loadProfiles();
  }, [isAdmin, navigate, loadProfiles]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      profile_id: user.profile_id.toString(),
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;

    try {
      // Atualiza perfil e status separadamente
      if (editForm.profile_id !== selectedUser.profile_id.toString()) {
        await api.patch(`/users/${selectedUser.id}/profile`, {
          profile_id: parseInt(editForm.profile_id),
        });
      }

      if (editForm.status !== selectedUser.status) {
        await api.patch(`/users/${selectedUser.id}/status`, {
          status: editForm.status,
        });
      }

      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success('Usuário deletado com sucesso!');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Nome', flex: 1, minWidth: 200 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 250 },
    {
      field: 'profile_name',
      headerName: 'Perfil',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || `Perfil ${params.row.profile_id}`}
          color={params.row.profile_id === 1 ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 'ativo' ? 'Ativo' : 'Inativo'}
          color={params.value === 'ativo' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Data de Criação',
      width: 180,
      renderCell: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleEditClick(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Deletar"
          onClick={() => handleDeleteClick(params.row)}
          disabled={params.row.id === user?.id} // Não pode deletar a si mesmo
        />,
      ],
    },
  ];

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestão de Usuários
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie usuários, perfis e permissões do sistema
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Como administrador, você pode visualizar, editar e excluir usuários permanentemente, além de gerenciar seus perfis e status.
        <strong> Atenção:</strong> A exclusão é permanente e não pode ser desfeita.
      </Alert>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Lista de Usuários</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filtrar por Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filtrar por Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'ativo' | 'inativo' | 'all');
                    setPagination({ ...pagination, page: 1 });
                  }}
                >
                  <MenuItem value="ativo">Apenas Ativos</MenuItem>
                  <MenuItem value="inativo">Apenas Inativos</MenuItem>
                  <MenuItem value="all">Todos</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
                disabled={loading}
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/cadastro-usuarios')}
              >
                Novo Usuário
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <DataGrid
                rows={users}
                columns={columns}
                paginationModel={{ page: pagination.page - 1, pageSize: pagination.limit }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                  },
                }}
                hideFooterPagination
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={(_, page) => setPagination({ ...pagination, page })}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Nome:</strong> {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>

              <TextField
                fullWidth
                select
                label="Perfil de Acesso"
                value={editForm.profile_id}
                onChange={(e) => setEditForm({ ...editForm, profile_id: e.target.value })}
                sx={{ mb: 2 }}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id.toString()}>
                    {profile.profile_name} {profile.description && `- ${profile.description}`}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja <strong>deletar permanentemente</strong> o usuário <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" component="div">
              <strong>⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!</strong>
              <br />
              O usuário será removido permanentemente do banco de dados e não poderá ser recuperado.
              <br />
              Se você apenas deseja impedir o acesso, considere alterar o status para "Inativo" ao invés de deletar.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestaoUsuarios;

