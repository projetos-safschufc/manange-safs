import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface DashboardStats {
  totalMateriais: number;
  totalFuncionarios: number;
  materiaisSemResponsavel: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMateriais: 0,
    totalFuncionarios: 0,
    materiaisSemResponsavel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        console.error('Erro ao carregar estatísticas do dashboard:', err);
        setError(err.response?.data?.error || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total de Materiais',
      value: loading ? '...' : stats.totalMateriais.toLocaleString('pt-BR'),
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      loading,
    },
    {
      title: 'Total de Funcionários',
      value: loading ? '...' : stats.totalFuncionarios.toLocaleString('pt-BR'),
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'secondary.main',
      loading,
    },
    {
      title: 'Materiais sem Responsável',
      value: loading ? '...' : stats.materiaisSemResponsavel.toLocaleString('pt-BR'),
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
      loading,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Box>
      )}
      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    {stat.loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CircularProgress size={24} sx={{ color: stat.color }} />
                      </Box>
                    ) : (
                      <Typography variant="h4" component="div" sx={{ color: stat.color, fontWeight: 600 }}>
                        {stat.value}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ color: stat.color, ml: 2 }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;

