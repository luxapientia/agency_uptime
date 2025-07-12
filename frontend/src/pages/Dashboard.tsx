import { useState, useEffect, type ReactElement } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  Stack,
  Skeleton,
  alpha,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  SignalCellularAlt as SignalIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import axios from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Statistics {
  totalSites: number;
  onlineSites: number;
  sitesWithSsl: number;
  sitesWithNotifications: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactElement;
  color: string;
  delay: number;
  subtitle?: string;
}

const StatsCard = ({ title, value, icon, color, delay, subtitle }: StatsCardProps) => {
  const theme = useTheme();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      style={{ height: '100%' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(color, isHovered ? 0.3 : 0.1)}`,
          transition: theme.transitions.create(
            ['transform', 'box-shadow', 'border-color', 'background'],
            { duration: theme.transitions.duration.shorter }
          ),
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: isHovered 
            ? `0 12px 24px -8px ${alpha(color, 0.3)}`
            : `0 4px 12px -2px ${alpha(color, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at top right, ${alpha(color, 0.12)}, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          },
        }}
      >
        <CardContent sx={{ height: '100%', position: 'relative' }}>
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <motion.div
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  rotate: isHovered ? 5 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(color, 0.15),
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '0.3s all',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {icon}
                </Box>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: isHovered ? -5 : 0
                }}
                transition={{ 
                  duration: 0.5,
                  delay: delay + 0.2,
                  ease: "easeOut"
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: isHovered
                      ? `linear-gradient(135deg, ${color} 0%, ${theme.palette.primary.main} 100%)`
                      : `linear-gradient(135deg, ${color} 30%, ${theme.palette.primary.main} 90%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    transition: '0.3s all',
                  }}
                >
                  {value}
                </Typography>
              </motion.div>
            </Stack>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.8),
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LoadingCard = () => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Skeleton
              variant="rounded"
              width={48}
              height={48}
              sx={{ borderRadius: 3 }}
            />
            <Skeleton 
              variant="rounded" 
              width={80} 
              height={48}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              }}
            />
          </Stack>
          <Box>
            <Skeleton 
              variant="text" 
              width={140} 
              height={32}
              sx={{
                borderRadius: 1,
                mb: 1,
                background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              }}
            />
            <Skeleton 
              variant="text" 
              width={100} 
              height={24}
              sx={{
                borderRadius: 1,
                background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await axios.get<Statistics>('/sites/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setError('Failed to fetch statistics. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsCards = [
    {
      title: 'Total Sites',
      value: stats?.totalSites || 0,
      icon: <StorageIcon />,
      color: theme.palette.primary.main,
      delay: 0,
      subtitle: 'All monitored websites',
    },
    {
      title: 'Online Sites',
      value: stats?.onlineSites || 0,
      icon: <SignalIcon />,
      color: theme.palette.success.main,
      delay: 0.1,
      subtitle: 'Currently operational',
    },
    {
      title: 'SSL Protected',
      value: stats?.sitesWithSsl || 0,
      icon: <SecurityIcon />,
      color: theme.palette.info.main,
      delay: 0.2,
      subtitle: 'Secure connections',
    },
    {
      title: 'With Notifications',
      value: stats?.sitesWithNotifications || 0,
      icon: <NotificationsIcon />,
      color: theme.palette.warning.main,
      delay: 0.3,
      subtitle: 'Alert system enabled',
    },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: { xs: '150px', sm: '300px' },
            height: '100%',
            background: `linear-gradient(45deg, transparent, ${alpha(theme.palette.primary.main, 0.03)})`,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ position: 'relative' }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  : `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.8),
                fontWeight: 500,
              }}
            >
              Here's what's happening with your monitored sites
            </Typography>
          </Box>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Tooltip title="Refresh statistics" arrow>
              <IconButton
                onClick={fetchStats}
                sx={{
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                {isRefreshing ? (
                  <CircularProgress
                    size={24}
                    thickness={4}
                    sx={{ color: theme.palette.primary.main }}
                  />
                ) : (
                  <RefreshIcon
                    sx={{
                      color: theme.palette.primary.main,
                      transition: '0.3s all',
                    }}
                  />
                )}
              </IconButton>
            </Tooltip>
          </motion.div>
        </Stack>
      </Paper>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography
                color="error"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {error}
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, sm: 3 },
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          mb: 4,
        }}
      >
        {isLoading
          ? Array(5)
              .fill(null)
              .map((_, index) => <LoadingCard key={index} />)
          : statsCards.map((card, index) => (
              <StatsCard key={index} {...card} />
            ))}
      </Box>
    </Box>
  );
}
