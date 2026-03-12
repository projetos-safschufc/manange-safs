import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { toast } from 'react-toastify';
import { RootState } from '../store/store';
import api from '../services/api';
import EbserhLogo from '../components/EbserhLogo';

const validationSchema = Yup.object({
  name: Yup.string().min(3, 'Nome deve ter no mínimo 3 caracteres').required('Nome é obrigatório'),
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
  password: Yup.string().min(6, 'Senha deve ter no mínimo 6 caracteres').required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'As senhas devem ser iguais')
    .required('Confirmação de senha é obrigatória'),
});

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Limpa os dados antes de enviar
        const userData = {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        };

        const response = await api.post('/users/register', userData);
        
        toast.success(response.data.message || 'Cadastro realizado com sucesso!');
        
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error: any) {
        console.error('Erro ao cadastrar usuário:', error);
        
        // Tratamento detalhado de erros
        let errorMessage = 'Erro ao realizar cadastro';
        
        if (error.response) {
          // Erro com resposta do servidor
          const errorData = error.response.data;
          
          if (errorData.details && Array.isArray(errorData.details)) {
            // Erros de validação com detalhes
            const detailsMessages = errorData.details.map((detail: any) => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            errorMessage = `Dados inválidos: ${detailsMessages}`;
          } else if (errorData.error) {
            // Erro genérico do servidor
            errorMessage = errorData.error;
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            }
          } else if (error.response.status === 400) {
            errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
          } else if (error.response.status === 409) {
            errorMessage = 'Email já cadastrado. Tente fazer login ou use outro email.';
          } else if (error.response.status >= 500) {
            errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
          }
        } else if (error.request) {
          // Erro de rede (sem resposta)
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          // Outro tipo de erro
          errorMessage = error.message || 'Erro desconhecido ao realizar cadastro';
        }
        
        toast.error(errorMessage);
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <EbserhLogo size="large" />
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 2 }}>
            GEST-SAFS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sistema de Gestão de Materiais
          </Typography>
        </Box>
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h2" variant="h5" align="center" gutterBottom>
              Criar Conta
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Ao se cadastrar, você receberá automaticamente o perfil padrão do sistema.
            </Alert>
            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nome Completo"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                margin="normal"
                autoComplete="name"
                autoFocus
                required
              />
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="normal"
                autoComplete="email"
                required
              />
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Senha"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                margin="normal"
                autoComplete="new-password"
                required
              />
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar Senha"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                margin="normal"
                autoComplete="new-password"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Cadastrar'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    cursor: 'pointer',
                  }}
                >
                  Já tem uma conta? Faça login aqui
                </Link>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;

