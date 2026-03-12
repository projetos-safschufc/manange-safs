import { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '@mui/material';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../store/store';
import { fetchFuncionarioById, updateFuncionario } from '../store/slices/funcionarioSlice';

const validationSchema = Yup.object({
  nome_func: Yup.string().min(3, 'Nome deve ter no mínimo 3 caracteres').required('Nome é obrigatório'),
  setor_func: Yup.string().required('Setor é obrigatório'),
  cargo: Yup.string(),
  status: Yup.string().oneOf(['ativo', 'inativo'], 'Status inválido'),
});

const EditarFuncionario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentFuncionario, loading } = useSelector((state: RootState) => state.funcionario);

  useEffect(() => {
    if (id) {
      dispatch(fetchFuncionarioById(parseInt(id)));
    }
  }, [id, dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nome_func: currentFuncionario?.nome_func || '',
      setor_func: currentFuncionario?.setor_func || '',
      cargo: currentFuncionario?.cargo || '',
      status: currentFuncionario?.status || 'ativo',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!id) return;
      try {
        await dispatch(updateFuncionario({ id: parseInt(id), data: values })).unwrap();
        toast.success('Funcionário atualizado com sucesso!');
        navigate('/dashboard');
      } catch (error: any) {
        toast.error(error || 'Erro ao atualizar funcionário');
      }
    },
  });

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Editar Funcionário
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="nome_func"
                  name="nome_func"
                  label="Nome do Funcionário"
                  value={formik.values.nome_func}
                  onChange={formik.handleChange}
                  error={formik.touched.nome_func && Boolean(formik.errors.nome_func)}
                  helperText={formik.touched.nome_func && formik.errors.nome_func}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="setor_func"
                  name="setor_func"
                  label="Setor"
                  value={formik.values.setor_func}
                  onChange={formik.handleChange}
                  error={formik.touched.setor_func && Boolean(formik.errors.setor_func)}
                  helperText={formik.touched.setor_func && formik.errors.setor_func}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="cargo"
                  name="cargo"
                  label="Cargo"
                  value={formik.values.cargo}
                  onChange={formik.handleChange}
                  error={formik.touched.cargo && Boolean(formik.errors.cargo)}
                  helperText={formik.touched.cargo && formik.errors.cargo}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="status"
                  name="status"
                  label="Status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                >
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EditarFuncionario;

