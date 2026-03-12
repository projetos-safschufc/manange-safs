import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import { AppDispatch } from '../store/store';
import { createFuncionario, fetchFuncionarios } from '../store/slices/funcionarioSlice';

const validationSchema = Yup.object({
  nome_func: Yup.string().min(3, 'Nome deve ter no mínimo 3 caracteres').required('Nome é obrigatório'),
  setor_func: Yup.string().required('Setor é obrigatório'),
  cargo: Yup.string(),
  status: Yup.string().oneOf(['ativo', 'inativo'], 'Status inválido'),
});

const CadastroFuncionario = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const formik = useFormik({
    initialValues: {
      nome_func: '',
      setor_func: '',
      cargo: '',
      status: 'ativo',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Limpa valores vazios antes de enviar
        const cleanedValues: any = {
          nome_func: values.nome_func?.trim() || '',
          setor_func: values.setor_func?.trim() || '',
          status: values.status || 'ativo',
        };

        // Adiciona cargo apenas se não estiver vazio
        if (values.cargo && values.cargo.trim() !== '') {
          cleanedValues.cargo = values.cargo.trim();
        }

        console.log('📝 Valores limpos para envio:', cleanedValues);

        await dispatch(createFuncionario(cleanedValues)).unwrap();
        toast.success('Funcionário criado com sucesso!');
        dispatch(fetchFuncionarios({ page: 1, limit: 10 }));
        navigate('/funcionarios');
      } catch (error: any) {
        console.error('❌ Erro completo:', error);
        
        // Trata erros detalhados
        let errorMessage = 'Erro ao criar funcionário';
        
        // Erro de rede
        if (typeof error === 'string' && error.includes('conexão')) {
          errorMessage = error;
        } else if (error?.details && Array.isArray(error.details)) {
          errorMessage = `Erro: ${error.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')}`;
        } else if (error?.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        
        // Não navega em caso de erro
        // O usuário pode corrigir e tentar novamente
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Cadastrar Funcionário
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

export default CadastroFuncionario;

