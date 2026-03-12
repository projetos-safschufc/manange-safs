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
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { toast } from 'react-toastify';
import { AppDispatch } from '../store/store';
import { createCatalogoItem, fetchCatalogo } from '../store/slices/catalogSlice';

const validationSchema = Yup.object({
  master: Yup.string().max(255, 'Máximo 255 caracteres'),
  descricao_mat: Yup.string(),
  serv_aquisicao: Yup.string().max(255, 'Máximo 255 caracteres'),
  gr: Yup.string().max(255, 'Máximo 255 caracteres'),
});

const CadastroCatalogo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const formik = useFormik({
    initialValues: {
      master: '',
      aghu_hu: '',
      aghu_me: '',
      catmat: '',
      ebserh: '',
      descricao_mat: '',
      apres: '',
      setor_controle: '',
      resp_controle: '',
      serv_aquisicao: '',
      hosp_demand: '',
      resp_planj: '',
      resp_fisc: '',
      resp_gest_tec: '',
      gr: '',
      ativo: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(createCatalogoItem(values)).unwrap();
        toast.success('Item do catálogo criado com sucesso!');
        dispatch(fetchCatalogo({ page: 1, limit: 10 }));
        navigate('/dashboard');
      } catch (error: any) {
        toast.error(error || 'Erro ao criar item do catálogo');
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Cadastrar Item no Catálogo
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              {/* Identificação */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Identificação
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="master"
                  name="master"
                  label="Master"
                  value={formik.values.master}
                  onChange={formik.handleChange}
                  error={formik.touched.master && Boolean(formik.errors.master)}
                  helperText={formik.touched.master && formik.errors.master}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="gr"
                  name="gr"
                  label="Grupo (GR)"
                  value={formik.values.gr}
                  onChange={formik.handleChange}
                  error={formik.touched.gr && Boolean(formik.errors.gr)}
                  helperText={formik.touched.gr && formik.errors.gr}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="aghu_hu"
                  name="aghu_hu"
                  label="AGHU HU"
                  value={formik.values.aghu_hu}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="aghu_me"
                  name="aghu_me"
                  label="AGHU ME"
                  value={formik.values.aghu_me}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="catmat"
                  name="catmat"
                  label="Catmat"
                  value={formik.values.catmat}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="ebserh"
                  name="ebserh"
                  label="EBSERH"
                  value={formik.values.ebserh}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="descricao_mat"
                  name="descricao_mat"
                  label="Descrição do Material"
                  multiline
                  rows={3}
                  value={formik.values.descricao_mat}
                  onChange={formik.handleChange}
                  error={formik.touched.descricao_mat && Boolean(formik.errors.descricao_mat)}
                  helperText={formik.touched.descricao_mat && formik.errors.descricao_mat}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="apres"
                  name="apres"
                  label="Apresentação"
                  value={formik.values.apres}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.ativo}
                      onChange={(e) => formik.setFieldValue('ativo', e.target.checked)}
                      name="ativo"
                    />
                  }
                  label="Ativo"
                />
              </Grid>

              {/* Aquisição */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Aquisição
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="serv_aquisicao"
                  name="serv_aquisicao"
                  label="Serviço de Aquisição"
                  value={formik.values.serv_aquisicao}
                  onChange={formik.handleChange}
                  error={formik.touched.serv_aquisicao && Boolean(formik.errors.serv_aquisicao)}
                  helperText={formik.touched.serv_aquisicao && formik.errors.serv_aquisicao}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="hosp_demand"
                  name="hosp_demand"
                  label="Hospital Demandante"
                  value={formik.values.hosp_demand}
                  onChange={formik.handleChange}
                />
              </Grid>

              {/* Responsabilidades */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Responsabilidades (opcional)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="resp_controle"
                  name="resp_controle"
                  label="Responsável Controle"
                  value={formik.values.resp_controle}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="setor_controle"
                  name="setor_controle"
                  label="Setor Controle"
                  value={formik.values.setor_controle}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="resp_planj"
                  name="resp_planj"
                  label="Responsável Planejamento"
                  value={formik.values.resp_planj}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="resp_fisc"
                  name="resp_fisc"
                  label="Responsável Fiscal"
                  value={formik.values.resp_fisc}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="resp_gest_tec"
                  name="resp_gest_tec"
                  label="Responsável Gestão Técnica"
                  value={formik.values.resp_gest_tec}
                  onChange={formik.handleChange}
                />
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

export default CadastroCatalogo;

