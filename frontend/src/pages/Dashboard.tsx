import { useState, type ReactElement, cloneElement } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { type SvgIconProps } from '@mui/material/SvgIcon';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactElement<SvgIconProps>;
  color: string;
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Placeholder data - replace with real data from your state management
  const stats = {
    totalSites: 12,
    sitesUp: 10,
    sitesDown: 1,
    sitesWarning: 1,
    uptime: 99.9,
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your websites in real-time
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh} 
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'background.default' }
              }}
            >
              <RefreshIcon sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Add Website
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        mb: 4
      }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <StatsCard
            title="Total Sites"
            value={stats.totalSites}
            icon={<TimelineIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.primary.main}
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <StatsCard
            title="Sites Up"
            value={stats.sitesUp}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.success.main}
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <StatsCard
            title="Sites Warning"
            value={stats.sitesWarning}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.warning.main}
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <StatsCard
            title="Sites Down"
            value={stats.sitesDown}
            icon={<ErrorIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.error.main}
          />
        </Box>
      </Box>

      {/* Overall Status Card */}
      <Card 
        sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          borderRadius: 2
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
            <Typography variant="h6">Overall System Status</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2
          }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Average Uptime:
              </Typography>
              <Typography variant="h6" color="success.main">
                {stats.uptime}%
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Last Check:
              </Typography>
              <Typography variant="body1">
                {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          <Button size="small" color="primary">
            View Detailed Report
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        boxShadow: 2,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {cloneElement(icon, { sx: { fontSize: 40, color } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 