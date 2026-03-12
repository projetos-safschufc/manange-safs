import { Box, Typography } from '@mui/material';

interface EbserhLogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
  useImage?: boolean;
  imageSrc?: string;
}

const EbserhLogo = ({ 
  size = 'medium', 
  showSubtitle = true,
  useImage = false,
  imageSrc 
}: EbserhLogoProps) => {
  const sizes = {
    small: { main: '1.5rem', sub: '0.7rem', imageHeight: '40px' },
    medium: { main: '2rem', sub: '0.85rem', imageHeight: '50px' },
    large: { main: '3rem', sub: '1rem', imageHeight: '70px' },
  };

  const currentSize = sizes[size];

  // Se usar imagem e tiver src, exibe a imagem
  if (useImage && imageSrc) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box
          component="img"
          src={imageSrc}
          alt="EBSERH - Hospitais Universitários Federais"
          sx={{
            height: currentSize.imageHeight,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </Box>
    );
  }

  // Versão texto padrão
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: currentSize.main,
          lineHeight: 1,
          letterSpacing: '0.05em',
        }}
      >
        <Box component="span" sx={{ color: '#4A4A4A' }}>
          EBSER
        </Box>
        <Box component="span" sx={{ color: '#00A859' }}>
          H
        </Box>
      </Typography>
      {showSubtitle && (
        <Typography
          variant="caption"
          sx={{
            fontSize: currentSize.sub,
            color: '#4A4A4A',
            fontWeight: 400,
            mt: 0.5,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          HOSPITAIS UNIVERSITÁRIOS FEDERAIS
        </Typography>
      )}
    </Box>
  );
};

export default EbserhLogo;