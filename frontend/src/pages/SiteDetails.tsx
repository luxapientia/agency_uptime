import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  useTheme,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Tooltip as MuiTooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NetworkCheck as NetworkIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  AccessTime as TimeIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as CancelIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  GppBad as UnverifiedIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { RootState } from '../store';
import { fetchSiteStatus, fetchSiteStatusHistory } from '../store/slices/siteStatusSlice';
import SiteForm from '../components/sites/SiteForm';
import NotificationSettings from '../components/sites/NotificationSettings';
import { setSelectedSite, updateSite } from '../store/slices/siteSlice';
import type { CreateSiteData } from '../types/site.types';
import type { AppDispatch } from '../store';

export default function SiteDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();

  const site = useSelector((state: RootState) => 
    state.sites.sites.find(s => s.id === id)
  );
  const siteStatus = useSelector((state: RootState) => 
    state.siteStatus.statuses[id || '']
  );
  const statusHistory = useSelector((state: RootState) => 
    state.siteStatus.statusHistory[id || '']
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [timeRange, setTimeRange] = useState(24); // Default to 24 hours

  useEffect(() => {
    const loadSiteData = async () => {
      if (!id) return;
      if (!isLoading) {
        setIsGraphLoading(true);
      } else {
        setIsLoading(true);
      }
      try {
        await Promise.all([
          dispatch(fetchSiteStatus(id)),
          dispatch(fetchSiteStatusHistory({ siteId: id, hours: timeRange }))
        ]);
      } catch (error) {
        console.error('Failed to fetch site data:', error);
      } finally {
        setIsLoading(false);
        setIsGraphLoading(false);
      }
    };

    loadSiteData();
  }, [id, dispatch, timeRange]);

  const handleEditClick = () => {
    if (site) {
      dispatch(setSelectedSite(site));
      setIsFormOpen(true);
    }
  };

  const handleFormSubmit = async (values: CreateSiteData) => {
    if (site) {
      await dispatch(updateSite({ id: site.id, data: values }));
    }
    setIsFormOpen(false);
  };

  const handleFormClose = () => {
    dispatch(setSelectedSite(null));
    setIsFormOpen(false);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const formatHistoryData = (history: any[] = []) => {
    return history.map(status => ({
      timestamp: new Date(status.checkedAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      httpResponseTime: status.httpResponseTime || 0,
      pingResponseTime: status.pingResponseTime || 0,
      overallUptime: status.overallUptime || 0,
      httpUptime: status.httpUptime || 0,
      pingUptime: status.pingUptime || 0
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <Box
        sx={{
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1.5,
          boxShadow: theme.shadows[3],
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: entry.color,
              }}
            />
            <Typography variant="body2">
              {entry.name}: {entry.value}
              {entry.name.includes('Time') ? 'ms' : '%'}
            </Typography>
          </Stack>
        ))}
      </Box>
    );
  };

  if (!site) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Site not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sites')}
          sx={{ mt: 2 }}
        >
          Back to Sites
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => navigate('/sites')}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{
            fontWeight: 'bold',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
              : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {site.name}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={handleEditClick}
          >
            Edit Site
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Status Card */}
          <Card
            sx={{
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.background.paper,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={3}>
                {/* Status Header */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                      }}
                    >
                      {siteStatus?.isUp ? (
                        <CheckIcon
                          sx={{
                            fontSize: { xs: 32, sm: 40 },
                            color: theme.palette.success.main,
                            animation: 'fadeIn 0.5s ease-in',
                            '@keyframes fadeIn': {
                              '0%': { opacity: 0, transform: 'scale(0.8)' },
                              '100%': { opacity: 1, transform: 'scale(1)' },
                            },
                          }}
                        />
                      ) : (
                        <CancelIcon
                          sx={{
                            fontSize: { xs: 32, sm: 40 },
                            color: theme.palette.error.main,
                            animation: 'fadeIn 0.5s ease-in',
                            '@keyframes fadeIn': {
                              '0%': { opacity: 0, transform: 'scale(0.8)' },
                              '100%': { opacity: 1, transform: 'scale(1)' },
                            },
                          }}
                        />
                      )}
                      {isGraphLoading && (
                        <CircularProgress
                          size={44}
                          sx={{
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            color: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Box>
                    <Stack spacing={0.5}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          fontWeight: 600,
                          color: siteStatus?.isUp ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {siteStatus?.isUp ? 'Site is Online' : 'Site is Offline'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <TimeIcon sx={{ fontSize: 16 }} />
                        Last checked: {siteStatus?.checkedAt ?
                          new Date(siteStatus.checkedAt).toLocaleString() :
                          'Never'}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box sx={{ flexGrow: 1 }} />

                  <Stack 
                    direction="row" 
                    spacing={1} 
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'space-between', sm: 'flex-end' }
                    }}
                  >
                    <MuiTooltip title="Refresh Status">
                      <IconButton
                        onClick={() => {
                          setIsGraphLoading(true);
                          dispatch(fetchSiteStatus(id || ''))
                            .then(() => setIsGraphLoading(false));
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </MuiTooltip>
                    <Button
                      component="a"
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<NetworkIcon />}
                      variant="contained"
                      sx={{
                        borderRadius: 1,
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                          : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`
                            : `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                        }
                      }}
                    >
                      Visit Site
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Quick Stats */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Response Time
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6" color="text.primary">
                        {siteStatus?.httpResponseTime || 0}ms
                      </Typography>
                      <Chip 
                        label="HTTP" 
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                        }}
                      />
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Ping Time
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6" color="text.primary">
                        {siteStatus?.pingResponseTime || 0}ms
                      </Typography>
                      <Chip 
                        label="ICMP" 
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                        }}
                      />
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Overall Uptime
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6" color="text.primary">
                        {((siteStatus?.overallUptime || 0)).toFixed(2)}%
                      </Typography>
                      <Chip 
                        label="24h" 
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>

                {/* SSL Information */}
                {siteStatus?.hasSsl && (
                  <>
                    <Divider />
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <SecurityIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          SSL Certificate
                        </Typography>
                      </Stack>

                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={3}
                        divider={<Divider orientation="vertical" flexItem />}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? (
                              <VerifiedIcon sx={{ color: theme.palette.success.main }} />
                            ) : (
                              <UnverifiedIcon sx={{ color: theme.palette.warning.main }} />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Expires in {siteStatus?.sslDaysUntilExpiry || 0} days
                            </Typography>
                          </Stack>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Valid until: {siteStatus?.sslValidTo && new Date(siteStatus.sslValidTo).toLocaleDateString() || 'N/A'}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              Issuer: {siteStatus?.sslIssuer || 'Unknown'}
                            </Typography>
                            <MuiTooltip title={siteStatus?.sslIssuer || 'Unknown'}>
                              <InfoIcon 
                                sx={{ 
                                  fontSize: 16,
                                  color: theme.palette.text.secondary,
                                  cursor: 'help',
                                }}
                              />
                            </MuiTooltip>
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={<SecurityIcon />}
                          label={(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? "Certificate Valid" : "Certificate Expiring Soon"}
                          color={(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? "success" : "warning"}
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Status History Graphs */}
          <Card
            sx={{
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.background.paper,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <TimelineIcon 
                  color="primary"
                  sx={{ 
                    fontSize: { xs: 24, sm: 28 },
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.6 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.6 },
                    },
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    fontWeight: 600,
                  }}
                >
                  Status History
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 150,
                    '& .MuiOutlinedInput-root': {
                      background: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.08),
                      }
                    }
                  }}
                >
                  <Select
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                    startAdornment={
                      <TimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    }
                    sx={{
                      borderRadius: 1,
                      '& .MuiSelect-select': {
                        py: 1,
                      }
                    }}
                  >
                    <MenuItem value={1}>Last Hour</MenuItem>
                    <MenuItem value={12}>Last 12 Hours</MenuItem>
                    <MenuItem value={24}>Last 24 Hours</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              
              {statusHistory && statusHistory.length > 0 ? (
                <Stack spacing={3}>
                  {/* Uptime Percentages Graph */}
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: { xs: 250, sm: 300, md: 350 },
                      transition: 'height 0.3s ease',
                      position: 'relative',
                      '& .recharts-text': {
                        fontSize: { xs: '10px !important', sm: '12px !important' }
                      },
                      '& .recharts-cartesian-grid-horizontal line:last-child, & .recharts-cartesian-grid-vertical line:last-child': {
                        display: 'none',
                      },
                    }}
                  >
                    {isGraphLoading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: alpha(theme.palette.background.paper, 0.7),
                          backdropFilter: 'blur(4px)',
                          zIndex: 1,
                          borderRadius: 1,
                        }}
                      >
                        <CircularProgress size={40} />
                      </Box>
                    )}
                    <ResponsiveContainer>
                      <AreaChart
                        data={formatHistoryData(statusHistory || [])}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 35,
                        }}
                      >
                        <defs>
                          <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="httpGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="pingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={alpha(theme.palette.text.primary, 0.05)}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="timestamp"
                          angle={0}
                          textAnchor="middle"
                          height={40}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                          }}
                          stroke={theme.palette.divider}
                          tickMargin={10}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                          }}
                          stroke={theme.palette.divider}
                          label={{ 
                            value: 'Uptime (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { 
                              fill: theme.palette.text.secondary,
                            }
                          }}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          wrapperStyle={{ outline: 'none' }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          wrapperStyle={{
                            paddingBottom: '20px',
                            fontSize: '0.875rem',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="overallUptime"
                          stroke={theme.palette.success.main}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#uptimeGradient)"
                          name="Overall Uptime"
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 0,
                            fill: theme.palette.success.main,
                          }}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="httpUptime"
                          stroke={theme.palette.info.main}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#httpGradient)"
                          name="HTTP Uptime"
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 0,
                            fill: theme.palette.info.main,
                          }}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="pingUptime"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#pingGradient)"
                          name="Ping Uptime"
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 0,
                            fill: theme.palette.primary.main,
                          }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Response Times Graph */}
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: { xs: 250, sm: 300, md: 350 },
                      transition: 'height 0.3s ease',
                      position: 'relative',
                      '& .recharts-text': {
                        fontSize: { xs: '10px !important', sm: '12px !important' }
                      },
                      '& .recharts-cartesian-grid-horizontal line:last-child, & .recharts-cartesian-grid-vertical line:last-child': {
                        display: 'none',
                      },
                    }}
                  >
                    {isGraphLoading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: alpha(theme.palette.background.paper, 0.7),
                          backdropFilter: 'blur(4px)',
                          zIndex: 1,
                          borderRadius: 1,
                        }}
                      >
                        <CircularProgress size={40} />
                      </Box>
                    )}
                    <ResponsiveContainer>
                      <AreaChart
                        data={formatHistoryData(statusHistory || [])}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 35,
                        }}
                      >
                        <defs>
                          <linearGradient id="httpResponseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="pingResponseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={alpha(theme.palette.text.primary, 0.05)}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="timestamp"
                          angle={0}
                          textAnchor="middle"
                          height={40}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                          }}
                          stroke={theme.palette.divider}
                          tickMargin={10}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ 
                            fill: theme.palette.text.secondary,
                          }}
                          stroke={theme.palette.divider}
                          label={{ 
                            value: 'Response Time (ms)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { 
                              fill: theme.palette.text.secondary,
                            }
                          }}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          wrapperStyle={{ outline: 'none' }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          wrapperStyle={{
                            paddingBottom: '20px',
                            fontSize: '0.875rem',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="httpResponseTime"
                          stroke={theme.palette.warning.main}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#httpResponseGradient)"
                          name="HTTP Response Time"
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 0,
                            fill: theme.palette.warning.main,
                          }}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="pingResponseTime"
                          stroke={theme.palette.secondary.main}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#pingResponseGradient)"
                          name="Ping Response Time"
                          activeDot={{ 
                            r: 6, 
                            strokeWidth: 0,
                            fill: theme.palette.secondary.main,
                          }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 4, sm: 6 },
                    px: 2,
                    background: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    minHeight: { xs: 200, sm: 250, md: 300 },
                  }}
                >
                  <TimelineIcon 
                    sx={{ 
                      fontSize: { xs: 36, sm: 48 }, 
                      color: alpha(theme.palette.text.secondary, 0.5),
                      mb: 2
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    No History Data
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    align="center"
                    sx={{ 
                      maxWidth: 300,
                      fontSize: { xs: '0.813rem', sm: '0.875rem' }
                    }}
                  >
                    Status history will appear here once monitoring data is collected.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Edit Site Dialog */}
      <SiteForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        site={site}
      />

      {/* Notification Settings Dialog */}
      <NotificationSettings
        siteId={site.id}
      />
    </Box>
  );
} 
