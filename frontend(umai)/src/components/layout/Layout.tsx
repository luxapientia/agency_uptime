import type { ReactNode } from 'react';
import { Box, Container, useTheme, alpha, useMediaQuery } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.default, 0.95)
          : theme.palette.background.default,
        transition: theme.transitions.create(['background-color'], {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Header />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, sm: 9, md: 10 },
          pb: { xs: 4, sm: 5, md: 6 },
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.05)}, transparent 40%),
                 radial-gradient(circle at 100% 0%, ${alpha(theme.palette.secondary.main, 0.05)}, transparent 40%)`
              : `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.03)}, transparent 40%),
                 radial-gradient(circle at 100% 0%, ${alpha(theme.palette.secondary.main, 0.03)}, transparent 40%)`,
            zIndex: -1,
            pointerEvents: 'none',
          },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            height: '100%',
            animation: 'fadeIn 0.5s ease-out',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {children}
        </Container>
      </Box>

      <Toaster
        position={isMobile ? "bottom-center" : "top-right"}
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadius,
            padding: '12px 24px',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 4px 20px ${alpha(theme.palette.common.black, 0.25)}`
              : `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          },
          success: {
            iconTheme: {
              primary: theme.palette.success.main,
              secondary: theme.palette.success.contrastText,
            },
            style: {
              background: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            },
          },
          error: {
            iconTheme: {
              primary: theme.palette.error.main,
              secondary: theme.palette.error.contrastText,
            },
            style: {
              background: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            },
          },
          loading: {
            iconTheme: {
              primary: theme.palette.primary.main,
              secondary: theme.palette.primary.contrastText,
            },
            style: {
              background: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            },
          },
        }}
      />
    </Box>
  );
} 