import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
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
import api from '../services/api';

interface AccessProfile {
  id: number;
  profile_name: string;
  description?: string;
}

const validationSchema = Yup.object({
  name: Yup.string().min(3, 'Nome deve ter no mínimo 3 caracteres').required('Nome é obrigatório'),
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
  password: Yup.string().min(6, 'Senha deve ter no mínimo 6 caracteres').required('Senha é obrigatória'),
  profile_id: Yup.number().positive().required('Perfil é obrigatório'),
});

const CadastroUsuarios = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await api.get('/users/profiles');
        setProfiles(response.data);
      } catch (error) {
        toast.error('Erro ao carregar perfis');
      } finally {
        setLoadingProfiles(false);
      }
    };
    loadProfiles();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      profile_id: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Tenta cadastro público primeiro (se não houver usuários), senão usa rota protegida
        try {
          await api.post('/users/public', {
            name: values.name,
            email: values.email,
            password: values.password,
            profile_id: values.profile_id ? parseInt(values.profile_id as string) : undefined,
          });
        } catch (publicError: any) {
          // Se erro 403, significa que já existem usuários, então usa rota protegida
          if (publicError.response?.status === 403) {
            await api.post('/users', {
              ...values,
              profile_id: parseInt(values.profile_id as string),
            });
          } else {
            throw publicError;
          }
        }
        toast.success('Usuário criado com sucesso!');
        // Se foi cadastro público, redireciona para login
        if (!values.profile_id) {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          formik.resetForm();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Erro ao criar usuário');
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Cadastrar Usuário
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Nome"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Senha"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  id="profile_id"
                  name="profile_id"
                  label="Perfil de Acesso"
                  value={formik.values.profile_id}
                  onChange={formik.handleChange}
                  error={formik.touched.profile_id && Boolean(formik.errors.profile_id)}
                  helperText={formik.touched.profile_id && formik.errors.profile_id}
                  required
                  disabled={loadingProfiles}
                >
                  {profiles.map((profile) => (
                    <MenuItem key={profile.id} value={profile.id}>
                      {profile.profile_name} {profile.description && `- ${profile.description}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={formik.isSubmitting || loadingProfiles}>
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CadastroUsuarios;

