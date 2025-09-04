import { useState, useEffect, type ReactElement } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Skeleton,
  alpha,
  Paper,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  SignalCellularAlt as SignalIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

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
  path: string;
  status?: 'success' | 'warning' | 'info' | 'error';
}

const StatsCard = ({ title, value, icon, color, delay, subtitle, path, status }: StatsCardProps) => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ color: '#10B981', fontSize: '1.2rem' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#F59E0B', fontSize: '1.2rem' }} />;
      default:
        return <TrendingUpIcon sx={{ color: '#3B82F6', fontSize: '1.2rem' }} />;
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      style={{ height: '100%' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: 'none',
          borderRadius: '24px',
          boxShadow: isHovered 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-12px) rotateX(5deg)' : 'none',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.4s ease',
            transformOrigin: 'left',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            right: '-20px',
            width: '40px',
            height: '40px',
            background: `radial-gradient(circle, ${alpha(color, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translateY(-50%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
          },
        }}
        onClick={() => navigate(path)}
      >
        <CardContent sx={{ height: '100%', position: 'relative', p: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
                  border: `2px solid ${alpha(color, 0.2)}`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.5)})`,
                    borderRadius: '20px',
                    zIndex: -1,
                    opacity: isHovered ? 0.3 : 0,
                    transition: 'opacity 0.4s ease',
                  },
                }}
              >
                <motion.div
                  animate={{
                    scale: isHovered ? 1.2 : 1,
                    rotate: isHovered ? 15 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {icon}
                </motion.div>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                {getStatusIcon()}
                <Chip
                  label={status === 'success' ? 'Active' : status === 'warning' ? 'Alert' : 'Info'}
                  size="small"
                  sx={{
                    bgcolor: status === 'success' ? '#DCFCE7' : status === 'warning' ? '#FEF3C7' : '#DBEAFE',
                    color: status === 'success' ? '#166534' : status === 'warning' ? '#92400E' : '#1E40AF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    px: 1,
                  }}
                />
              </Box>
            </Box>

            {/* Value Section */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <motion.div
                animate={{
                  scale: isHovered ? 1.05 : 1,
                  y: isHovered ? -5 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${color} 0%, #1E293B 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '3rem', sm: '3.5rem', md: '4rem' },
                    lineHeight: 1,
                    mb: 1,
                    textAlign: 'center',
                  }}
                >
                  {value}
                </Typography>
              </motion.div>
            </Box>

            {/* Footer Section */}
            <Box>
              <Divider sx={{ mb: 2, borderColor: alpha(color, 0.2) }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#1E293B',
                  mb: 1,
                  fontSize: '1.125rem',
                  textAlign: 'center',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    lineHeight: 1.4,
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
  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: 'none',
        borderRadius: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Skeleton
              variant="rounded"
              width={64}
              height={64}
              sx={{ borderRadius: '20px' }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="rounded" width={50} height={24} sx={{ borderRadius: '12px' }} />
            </Box>
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Skeleton 
              variant="text" 
              width="80%" 
              height={80}
              sx={{ 
                mx: 'auto',
                borderRadius: 2,
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              }}
            />
          </Box>
          
          <Box>
            <Skeleton 
              variant="text" 
              width="60%" 
              height={24}
              sx={{ 
                mx: 'auto',
                mb: 1,
                borderRadius: 1,
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              }}
            />
            <Skeleton 
              variant="text" 
              width="80%" 
              height={20}
              sx={{ 
                mx: 'auto',
                borderRadius: 1,
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
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
      icon: <StorageIcon sx={{ fontSize: '2rem', color: '#3B82F6' }} />,
      color: '#3B82F6',
      delay: 0,
      subtitle: 'All monitored websites',
      path: '/sites',
      status: 'info' as const
    },
    {
      title: 'Online Sites',
      value: stats?.onlineSites || 0,
      icon: <SignalIcon sx={{ fontSize: '2rem', color: '#10B981' }} />,
      color: '#10B981',
      delay: 0.1,
      subtitle: 'Currently operational',
      path: '/sites/online',
      status: 'success' as const
    },
    {
      title: 'SSL Protected',
      value: stats?.sitesWithSsl || 0,
      icon: <SecurityIcon sx={{ fontSize: '2rem', color: '#8B5CF6' }} />,
      color: '#8B5CF6',
      delay: 0.2,
      subtitle: 'Secure connections',
      path: '/sites/ssl-protected',
      status: 'success' as const
    },
    {
      title: 'With Notifications',
      value: stats?.sitesWithNotifications || 0,
      icon: <NotificationsIcon sx={{ fontSize: '2rem', color: '#F59E0B' }} />,
      color: '#F59E0B',
      delay: 0.3,
      subtitle: 'Alert system enabled',
      path: '/sites/with-notifications',
      status: 'warning' as const
    },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      sx={{
        mt: 10,
      }}
    >
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 6,
          p: 5,
          background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
          border: 'none',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: { xs: '200px', sm: '400px' },
            height: '100%',
            background: 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.05))',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={4}
          sx={{ position: 'relative' }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1E293B 0%, #3B82F6 50%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                lineHeight: 1.2,
              }}
            >
              Welcome to UptimeMonitoring.ai
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#64748B',
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.4,
                maxWidth: '600px',
              }}
            >
              Monitor your website performance, security, and uptime with our advanced analytics dashboard
            </Typography>
          </Box>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Tooltip title="Refresh statistics" arrow>
              <IconButton
                onClick={fetchStats}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  boxShadow: '0 15px 35px rgba(59, 130, 246, 0.2)',
                  border: '3px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '20px',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: '#3B82F6',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 20px 45px rgba(59, 130, 246, 0.3)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {isRefreshing ? (
                  <CircularProgress
                    size={32}
                    thickness={4}
                    sx={{ color: '#3B82F6' }}
                  />
                ) : (
                  <RefreshIcon
                    sx={{
                      color: '#3B82F6',
                      fontSize: '1.75rem',
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
            transition={{ duration: 0.4 }}
          >
            <Paper
              sx={{
                p: 4,
                mb: 5,
                bgcolor: 'rgba(239, 68, 68, 0.05)',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.1)',
              }}
            >
              <Typography
                color="error"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontWeight: 600,
                  fontSize: '1.125rem',
                }}
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
          gap: { xs: 4, sm: 5 },
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          mb: 4,
        }}
      >
        {isLoading
          ? Array(4)
              .fill(null)
              .map((_, index) => <LoadingCard key={index} />)
          : statsCards.map((card, index) => (
              <StatsCard key={index} {...card} />
            ))}
      </Box>
    </Box>
  );
}
