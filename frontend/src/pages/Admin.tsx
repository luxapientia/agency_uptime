import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  Paper,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import UserManagement from '../components/admin/UserManagement';
import AdminDashboard from '../components/admin/AdminDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Admin() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event);
    setTabValue(newValue);
  };

  const adminTabs = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      component: <AdminDashboard />,
    },
    {
      label: 'User Management',
      icon: <PeopleIcon />,
      component: <UserManagement />,
    },
  ];

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
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Manage users and monitor system performance
          </Typography>
        </Box>
      </motion.div>

      {/* Admin Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            sx={{
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              },
            }}
          >
            {adminTabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                id={`admin-tab-${index}`}
                aria-controls={`admin-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        {adminTabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Container>
  );
} 