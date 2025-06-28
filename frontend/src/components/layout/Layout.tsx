import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      {/* Toolbar component for proper spacing below fixed AppBar */}
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 7, sm: 8 }, pb: 4 }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 24px',
          },
          success: {
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </Box>
  );
} 