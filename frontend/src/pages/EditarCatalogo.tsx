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
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../store/store';
import { fetchCatalogoById, updateCatalogoItem } from '../store/slices/catalogSlice';

const validationSchema = Yup.object({
  master: Yup.string().max(255, 'Máximo 255 caracteres'),
  descricao_mat: Yup.string(),
  serv_aquisicao: Yup.string().max(255, 'Máximo 255 caracteres'),
  gr: Yup.string().max(255, 'Máximo 255 caracteres'),
});

const EditarCatalogo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentItem, loading } = useSelector((state: RootState) => state.catalog);

  useEffect(() => {
    if (id) {
      dispatch(fetchCatalogoById(parseInt(id)));
    }
  }, [id, dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      master: currentItem?.master || '',
      aghu_hu: currentItem?.aghu_hu || '',
      aghu_me: currentItem?.aghu_me || '',
      catmat: currentItem?.catmat || '',
      ebserh: currentItem?.ebserh || '',
      descricao_mat: currentItem?.descricao_mat || '',
      apres: currentItem?.apres || '',
      setor_controle: currentItem?.setor_controle || '',
      resp_controle: currentItem?.resp_controle || '',
      serv_aquisicao: currentItem?.serv_aquisicao || '',
      hosp_demand: currentItem?.hosp_demand || '',
      resp_planj: currentItem?.resp_planj || '',
      resp_fisc: currentItem?.resp_fisc || '',
      resp_gest_tec: currentItem?.resp_gest_tec || '',
      gr: currentItem?.gr || '',
      ativo: currentItem?.ativo !== undefined ? currentItem.ativo : true,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!id) return;
      try {
        // Limpa valores vazios - converte strings vazias para null ou remove campos vazios
        const cleanedData: any = {};
        Object.keys(values).forEach(key => {
          const value = values[key as keyof typeof values];
          // Mantém valores válidos, converte strings vazias para null
          if (value !== undefined && value !== '') {
            cleanedData[key] = value;
          } else if (value === '') {
            // Campos opcionais podem ser null
            cleanedData[key] = null;
          }
        });

        await dispatch(updateCatalogoItem({ id: parseInt(id), data: cleanedData })).unwrap();
        toast.success('Item do catálogo atualizado com sucesso!');
        navigate('/catalogo');
      } catch (error: any) {
        const errorMessage = error?.details 
          ? `Erro: ${error.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')}`
          : error || 'Erro ao atualizar item do catálogo';
        toast.error(errorMessage);
        console.error('Erro ao atualizar catálogo:', error);
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
        Editar Item do Catálogo
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
                  Responsabilidades
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

export default EditarCatalogo;

