import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Inventory2 as Inventory2Icon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store/store';
import { useIsAdmin } from '../hooks/useIsAdmin';
import ModernHeader from './ModernHeader';

const drawerWidth = 240;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = useIsAdmin();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Catálogo de Materiais', icon: <Inventory2Icon />, path: '/catalogo' },
    ...(isAdmin ? [{ text: 'Cadastrar Catálogo', icon: <InventoryIcon />, path: '/cadastrar-catalogo' }] : []),
    ...(isAdmin ? [{ text: 'Funcionários', icon: <GroupsIcon />, path: '/funcionarios' }] : []),
    ...(isAdmin ? [{ text: 'Cadastrar Funcionário', icon: <PersonAddIcon />, path: '/cadastrar-funcionario' }] : []),
    { text: 'Atribuir Responsabilidade', icon: <AssignmentIcon />, path: '/atribuir-responsabilidade' },
    ...(isAdmin ? [
      { text: 'Gestão de Usuários', icon: <PeopleIcon />, path: '/gestao-usuarios' },
      { text: 'Cadastro de Usuários', icon: <PersonAddIcon />, path: '/cadastro-usuarios' },
    ] : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar 
        sx={{ 
          bgcolor: 'transparent', 
          color: 'text.primary', 
          justifyContent: 'center', 
          alignItems: 'center',
          py: 2, 
          px: 2,
          minHeight: { xs: '64px', sm: '70px' },
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1.25rem',
            color: 'primary.main',
            textAlign: 'center',
            width: '100%',
          }}
        >
          MENU
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header fixo ocupando toda a largura */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: '100%',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'transparent',
          boxShadow: 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <ModernHeader
          userName={user?.name}
          userEmail={user?.email}
          userProfile={user?.profile_name}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          anchorEl={anchorEl}
          onMenuClose={handleMenuClose}
          onLogoClick={handleLogoClick}
          onDrawerToggle={handleDrawerToggle}
        />
      </AppBar>

      {/* Container principal com flex para layout horizontal */}
      <Box sx={{ display: 'flex', flex: 1, mt: { xs: '72px', sm: '80px', md: '88px' }, minHeight: 'calc(100vh - 88px)' }}>
        {/* Sidebar - começa abaixo do header */}
        <Box
          component="nav"
          sx={{ 
            width: { sm: drawerWidth }, 
            flexShrink: { sm: 0 },
            height: '100%',
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                mt: { xs: '72px' },
                height: 'calc(100vh - 72px)',
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                border: 'none',
                boxShadow: 'none',
                position: 'fixed',
                height: 'calc(100vh - 88px)',
                top: { sm: '80px', md: '88px' },
                overflowY: 'auto',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Conteúdo principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: { sm: 'calc(100vh - 88px)' },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

