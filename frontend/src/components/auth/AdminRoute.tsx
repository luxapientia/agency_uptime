import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { RootState } from '../../store';

interface AdminRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role requirements
  const hasAdminAccess = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const hasSuperAdminAccess = user.role === 'SUPER_ADMIN';

  if (requireSuperAdmin && !hasSuperAdminAccess) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Super admin access required for this page.
        </Typography>
      </Box>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Admin access required for this page.
        </Typography>
      </Box>
    );
  }

  // User has required access, render the protected content
  return <>{children}</>;
} 