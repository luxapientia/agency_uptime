import {
  Box,
  Container,
  Typography,
  useTheme,
  Paper,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import UserManagement from '../components/admin/UserManagement';



export default function Admin() {
  const theme = useTheme();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Admin Panel
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Manage users and system access
          </Typography>
        </Box>
      </motion.div>

      {/* User Management Content */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          px: 3,
          py: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              User Management
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ py: 3 }}>
          <UserManagement />
        </Box>
      </Paper>
    </Container>
  );
} 