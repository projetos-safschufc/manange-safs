import { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Menu, MenuItem, Divider, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { AccountCircle as AccountCircleIcon, Logout as LogoutIcon, Menu as MenuIcon } from '@mui/icons-material';
import EbserhLogo from './EbserhLogo';

interface ModernHeaderProps {
  userName?: string;
  userEmail?: string;
  userProfile?: string;
  onMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
  onLogout: () => void;
  anchorEl: HTMLElement | null;
  onMenuClose: () => void;
  onLogoClick: () => void;
  onDrawerToggle?: () => void;
}

// Logomarca EBSERH em base64 (imagem completa fornecida pelo usuário)
// Nota: Se a imagem não carregar, o componente EbserhLogo será usado como fallback
const EBSERH_LOGO_BASE64 = 'data:image/png;base64,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...';

const ModernHeader: React.FC<ModernHeaderProps> = ({
  userName,
  userEmail,
  userProfile,
  onMenuClick,
  onLogout,
  anchorEl,
  onMenuClose,
  onLogoClick,
  onDrawerToggle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [imageError, setImageError] = useState(false);

  return (
    <Toolbar
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 1.5, sm: 2 },
        minHeight: { xs: '72px', sm: '80px', md: '88px' },
        bgcolor: '#00A859', // Verde EBSERH
        background: 'linear-gradient(135deg, #00A859 0%, #007A3F 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 168, 89, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 2 },
      }}
    >
      {/* Botão de menu mobile */}
      {onDrawerToggle && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{
            mr: 1,
            display: { sm: 'none' },
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Logo e Títulos */}
      <Box
        onClick={onLogoClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2, md: 3 },
          cursor: 'pointer',
          flex: { xs: '1 1 auto', md: '0 0 auto' },
          minWidth: 0, // Permite shrink
          '&:hover': {
            opacity: 0.95,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        {/* Logo Container */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white',
            borderRadius: { xs: 1.5, sm: 2 },
            p: { xs: 1, sm: 1.5 },
            minWidth: { xs: '56px', sm: '64px', md: '72px' },
            minHeight: { xs: '56px', sm: '64px', md: '72px' },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 168, 89, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            },
          }}
        >
          {!imageError ? (
            <img
              src={EBSERH_LOGO_BASE64}
              alt="EBSERH Logo"
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <EbserhLogo size="small" showSubtitle={false} />
            </Box>
          )}
        </Box>

        {/* Textos */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0, // Permite shrink
            flex: { xs: '1 1 auto', md: '0 0 auto' },
          }}
        >
          {/* Título Principal */}
          <Typography
            variant={isMobile ? 'body2' : isTablet ? 'body1' : 'h6'}
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              lineHeight: { xs: 1.3, sm: 1.4 },
              letterSpacing: { xs: '0.01em', sm: '0.02em' },
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            HUWC/MEAC - CHUFC
          </Typography>

          {/* Subtítulo */}
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            sx={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              lineHeight: { xs: 1.2, sm: 1.3 },
              letterSpacing: '0.01em',
              mt: { xs: 0.25, sm: 0.5 },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Sistema de Gestão de Materiais
          </Typography>
        </Box>
      </Box>

      {/* User Menu */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          flexShrink: 0,
        }}
      >
        {/* Nome e Perfil do usuário (oculto em mobile muito pequeno) */}
        {!isMobile && (
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              alignItems: 'flex-end',
              maxWidth: { sm: '120px', md: '180px' },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 500,
                fontSize: { sm: '0.875rem', md: '0.9375rem' },
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'right',
              }}
            >
              {userName}
            </Typography>
            {userProfile && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 400,
                  fontSize: { sm: '0.75rem', md: '0.8125rem' },
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  textAlign: 'right',
                  mt: 0.25,
                }}
              >
                {userProfile}
              </Typography>
            )}
          </Box>
        )}

        {/* Avatar */}
        <IconButton
          onClick={onMenuClick}
          sx={{
            p: 0,
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s ease-in-out',
            },
          }}
        >
          <Avatar
            sx={{
              width: { xs: 36, sm: 40, md: 44 },
              height: { xs: 36, sm: 40, md: 44 },
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {userName?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </IconButton>
      </Box>

      {/* Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
        onClick={onMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled sx={{ opacity: 1, py: 1.5 }}>
          <AccountCircleIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userEmail}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={onLogout}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'error.light',
              color: 'error.contrastText',
            },
          }}
        >
          <LogoutIcon sx={{ mr: 1.5 }} />
          Sair
        </MenuItem>
      </Menu>
    </Toolbar>
  );
};

export default ModernHeader;

