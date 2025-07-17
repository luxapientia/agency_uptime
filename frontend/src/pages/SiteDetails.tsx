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
  Tooltip as MuiTooltip,
  Divider,
  LinearProgress,
  Badge,
  Collapse,
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
  Wifi as PingIcon,
  Http as HttpIcon,
  Dns as DnsIcon,
  Router as TcpIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Hub as ConsensusIcon,
  Speed as SpeedIcon,
  Psychology as AiIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import type { RootState } from '../store';
import { fetchSiteStatus, fetchSiteStatusHistory } from '../store/slices/siteStatusSlice';
import SiteForm from '../components/sites/SiteForm';
import WorkerResponseTimeChart from '../components/sites/WorkerResponseTimeChart';
import AiAnalysisModal from '../components/sites/AiAnalysisModal';
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
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

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
          dispatch(fetchSiteStatusHistory({ siteId: id}))
        ]);
      } catch (error) {
        console.error('Failed to fetch site data:', error);
      } finally {
        setIsLoading(false);
        setIsGraphLoading(false);
      }
    };

    loadSiteData();
  }, [id, dispatch]);

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

  const handleAiAnalysis = () => {
    setIsAiDialogOpen(true);
  };

  const handleCloseAiDialog = () => {
    setIsAiDialogOpen(false);
  };

  // Get unique TCP ports from the status history
  const getTcpPorts = () => {
    if (!statusHistory || !statusHistory.length) return [];

    const portsSet = new Set<number>();
    statusHistory.forEach(status => {
      if (status.tcpChecks) {
        const tcpChecksArray = Array.isArray(status.tcpChecks)
          ? status.tcpChecks
          : Object.values(status.tcpChecks);
        tcpChecksArray.forEach((check: any) => {
          if (check?.port) {
            portsSet.add(check.port);
          }
        });
      }
    });

    return Array.from(portsSet).sort((a, b) => a - b);
  };

  // Helper function to get status color
  const getStatusColor = (isUp: boolean | undefined) => {
    if (isUp === undefined) return theme.palette.grey[500];
    return isUp ? theme.palette.success.main : theme.palette.error.main;
  };

  // Helper function to get status icon
  const getStatusIcon = (isUp: boolean | undefined, size = 20) => {
    if (isUp === undefined) {
      return <InfoIcon sx={{ fontSize: size, color: theme.palette.grey[500] }} />;
    }
    return isUp
      ? <CheckIcon sx={{ fontSize: size, color: theme.palette.success.main }} />
      : <CancelIcon sx={{ fontSize: size, color: theme.palette.error.main }} />;
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
          {/* Consensus Status Card */}
          <Card
            sx={{
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.background.paper,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              overflow: 'visible',
              border: `2px solid ${alpha(siteStatus?.isUp ? theme.palette.success.main : theme.palette.error.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={3}>
                {/* Main Status Header */}
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
                            fontSize: { xs: 40, sm: 48 },
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
                            fontSize: { xs: 40, sm: 48 },
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
                          size={52}
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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="h5"
                          sx={{
                            fontSize: { xs: '1.3rem', sm: '1.5rem' },
                            fontWeight: 700,
                            color: siteStatus?.isUp ? theme.palette.success.main : theme.palette.error.main,
                          }}
                        >
                          {siteStatus?.isUp ? 'Site is Online' : 'Site is Offline'}
                        </Typography>
                        <Badge
                          badgeContent={<ConsensusIcon sx={{ fontSize: 12 }} />}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText,
                            }
                          }}
                        >
                          <Chip
                            label={siteStatus?.workerId === 'consensus_worker' ? 'Consensus Status' : `Worker: ${siteStatus?.workerId}`}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          />
                        </Badge>
                      </Stack>
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
                    <MuiTooltip title="AI Health Analysis">
                      <Button
                        onClick={handleAiAnalysis}
                        startIcon={<AiIcon />}
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.info.main,
                          color: theme.palette.info.main,
                          '&:hover': {
                            borderColor: theme.palette.info.dark,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                          }
                        }}
                      >
                        AI Analysis
                      </Button>
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

                {/* Individual Status Indicators */}
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon color="primary" />
                    Service Status Overview
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ width: '100%' }}
                  >
                    {/* Ping Status */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 2,
                        background: alpha(getStatusColor(siteStatus?.pingIsUp), 0.08),
                        border: `1px solid ${alpha(getStatusColor(siteStatus?.pingIsUp), 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <Stack spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PingIcon sx={{ color: getStatusColor(siteStatus?.pingIsUp) }} />
                          {getStatusIcon(siteStatus?.pingIsUp, 16)}
                        </Stack>
                        <Typography variant="subtitle2" color="text.secondary" align="center">
                          Ping
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={getStatusColor(siteStatus?.pingIsUp)}>
                          {siteStatus?.pingIsUp === undefined ? 'Unknown' : (siteStatus.pingIsUp ? 'Online' : 'Offline')}
                        </Typography>
                        {siteStatus?.pingResponseTime !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {siteStatus.pingResponseTime}ms
                          </Typography>
                        )}
                      </Stack>
                    </Card>

                    {/* HTTP Status */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 2,
                        background: alpha(getStatusColor(siteStatus?.httpIsUp), 0.08),
                        border: `1px solid ${alpha(getStatusColor(siteStatus?.httpIsUp), 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <Stack spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <HttpIcon sx={{ color: getStatusColor(siteStatus?.httpIsUp) }} />
                          {getStatusIcon(siteStatus?.httpIsUp, 16)}
                        </Stack>
                        <Typography variant="subtitle2" color="text.secondary" align="center">
                          HTTP
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={getStatusColor(siteStatus?.httpIsUp)}>
                          {siteStatus?.httpIsUp === undefined ? 'Unknown' : (siteStatus.httpIsUp ? 'Online' : 'Offline')}
                        </Typography>
                        {siteStatus?.httpResponseTime !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {siteStatus.httpResponseTime}ms
                          </Typography>
                        )}
                      </Stack>
                    </Card>

                    {/* DNS Status */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 2,
                        background: alpha(getStatusColor(siteStatus?.dnsIsUp), 0.08),
                        border: `1px solid ${alpha(getStatusColor(siteStatus?.dnsIsUp), 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <Stack spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DnsIcon sx={{ color: getStatusColor(siteStatus?.dnsIsUp) }} />
                          {getStatusIcon(siteStatus?.dnsIsUp, 16)}
                        </Stack>
                        <Typography variant="subtitle2" color="text.secondary" align="center">
                          DNS
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={getStatusColor(siteStatus?.dnsIsUp)}>
                          {siteStatus?.dnsIsUp === undefined ? 'Unknown' : (siteStatus.dnsIsUp ? 'Online' : 'Offline')}
                        </Typography>
                        {siteStatus?.dnsResponseTime !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {siteStatus.dnsResponseTime}ms
                          </Typography>
                        )}
                      </Stack>
                    </Card>

                    {/* TCP Status Summary */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 2,
                        background: alpha(theme.palette.info.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <Stack spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TcpIcon sx={{ color: theme.palette.info.main }} />
                          <Badge
                            badgeContent={siteStatus?.tcpChecks?.length || 0}
                            color="info"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
                          >
                            <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                          </Badge>
                        </Stack>
                        <Typography variant="subtitle2" color="text.secondary" align="center">
                          TCP Ports
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {siteStatus?.tcpChecks?.filter(check => check.isUp).length || 0}/
                          {siteStatus?.tcpChecks?.length || 0} Open
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTcpPorts().join(', ') || 'None'}
                        </Typography>
                      </Stack>
                    </Card>
                  </Stack>
                </Stack>

                <Divider />

                {/* Uptime Statistics */}
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon color="primary" />
                    24-Hour Uptime Statistics
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    sx={{ width: '100%' }}
                  >
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                          Overall
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(siteStatus?.overallUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.overallUptime ?? 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.grey[500], 0.2),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: theme.palette.success.main,
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                          Ping
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(siteStatus?.pingUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.pingUptime ?? 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.grey[500], 0.2),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: theme.palette.info.main,
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                          HTTP
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(siteStatus?.httpUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.httpUptime ?? 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.grey[500], 0.2),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: theme.palette.warning.main,
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                          DNS
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(siteStatus?.dnsUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.dnsUptime ?? 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.grey[500], 0.2),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: theme.palette.secondary.main,
                          }
                        }}
                      />
                    </Stack>
                  </Stack>
                </Stack>

                {/* Advanced Details Toggle */}
                <Stack direction="row" justifyContent="center">
                  <Button
                    onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                    startIcon={showAdvancedDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    variant="text"
                    sx={{
                      textTransform: 'none',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {showAdvancedDetails ? 'Hide' : 'Show'} Advanced Details
                  </Button>
                </Stack>

                {/* Advanced Details */}
                <Collapse in={showAdvancedDetails}>
                  <Stack spacing={3}>
                    {/* DNS Information */}
                    {siteStatus?.dnsNameservers && siteStatus.dnsNameservers.length > 0 && (
                      <>
                        <Divider />
                        <Stack spacing={2}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DnsIcon color="secondary" />
                            DNS Information
                          </Typography>

                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={2}
                            sx={{ width: '100%' }}
                          >
                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Nameservers
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {siteStatus.dnsNameservers.map((ns, index) => (
                                  <Chip
                                    key={index}
                                    label={ns}
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                      color: theme.palette.secondary.main,
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Stack>

                            {siteStatus.dnsRecords?.addresses && (
                              <Stack spacing={1} sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  IP Addresses
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  {siteStatus.dnsRecords.addresses.map((addr, index) => (
                                    <Chip
                                      key={index}
                                      label={addr}
                                      size="small"
                                      sx={{
                                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                                        color: theme.palette.info.main,
                                      }}
                                    />
                                  ))}
                                </Stack>
                              </Stack>
                            )}
                          </Stack>
                        </Stack>
                      </>
                    )}

                    {/* TCP Port Details */}
                    {siteStatus?.tcpChecks && siteStatus.tcpChecks.length > 0 && (
                      <>
                        <Divider />
                        <Stack spacing={2}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TcpIcon color="warning" />
                            TCP Port Status
                          </Typography>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ width: '100%' }}
                          >
                            {siteStatus.tcpChecks.map((check, index) => (
                              <Card
                                key={index}
                                sx={{
                                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                                  minWidth: 200,
                                  p: 2,
                                  background: alpha(getStatusColor(check.isUp), 0.08),
                                  border: `1px solid ${alpha(getStatusColor(check.isUp), 0.2)}`,
                                }}
                              >
                                <Stack spacing={1}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      Port {check.port}
                                    </Typography>
                                    {getStatusIcon(check.isUp, 18)}
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    color={getStatusColor(check.isUp)}
                                    fontWeight={600}
                                  >
                                    {check.isUp ? 'Open' : 'Closed'}
                                  </Typography>
                                  {check.responseTime !== undefined && (
                                    <Typography variant="caption" color="text.secondary">
                                      Response: {check.responseTime}ms
                                    </Typography>
                                  )}
                                  {check.error && (
                                    <Typography variant="caption" color="error">
                                      Error: {check.error}
                                    </Typography>
                                  )}
                                </Stack>
                              </Card>
                            ))}
                          </Stack>
                        </Stack>
                      </>
                    )}

                    {/* SSL Information */}
                    {siteStatus?.hasSsl && (
                      <>
                        <Divider />
                        <Stack spacing={2}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SecurityIcon color="primary" />
                            SSL Certificate Details
                          </Typography>

                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={3}
                            sx={{ width: '100%' }}
                          >
                            <Stack spacing={1} alignItems="center" sx={{ flex: 1 }}>
                              {(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? (
                                <VerifiedIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
                              ) : (
                                <UnverifiedIcon sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
                              )}
                              <Typography variant="h6" fontWeight={600}>
                                {siteStatus?.sslDaysUntilExpiry || 0} days
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Until expiry
                              </Typography>
                            </Stack>

                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Valid From
                              </Typography>
                              <Typography variant="body2">
                                {siteStatus?.sslValidFrom ?
                                  new Date(siteStatus.sslValidFrom).toLocaleDateString() :
                                  'N/A'}
                              </Typography>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                                Valid Until
                              </Typography>
                              <Typography variant="body2">
                                {siteStatus?.sslValidTo ?
                                  new Date(siteStatus.sslValidTo).toLocaleDateString() :
                                  'N/A'}
                              </Typography>
                            </Stack>

                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Certificate Issuer
                              </Typography>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {siteStatus?.sslIssuer || 'Unknown'}
                              </Typography>
                              <Chip
                                icon={<SecurityIcon />}
                                label={(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? "Certificate Valid" : "Certificate Expiring Soon"}
                                color={(siteStatus?.sslDaysUntilExpiry || 0) > 30 ? "success" : "warning"}
                                size="small"
                                sx={{ borderRadius: 1, mt: 1 }}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>

          {/* Worker Response Time Graphs */}
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
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
                variant="h5"
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  fontWeight: 600,
                }}
              >
                Worker Response Times
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
            </Stack>

            {/* Ping Response Time Chart */}
            <WorkerResponseTimeChart
              title="Ping Response Times"
              siteStatuses={statusHistory || []}
              responseTimeField="pingResponseTime"
              icon={<PingIcon color="primary" />}
              height={300}
            />

            {/* HTTP Response Time Chart */}
            <WorkerResponseTimeChart
              title="HTTP Response Times"
              siteStatuses={statusHistory || []}
              responseTimeField="httpResponseTime"
              icon={<HttpIcon color="info" />}
              height={300}
            />

            {/* DNS Response Time Chart */}
            <WorkerResponseTimeChart
              title="DNS Response Times"
              siteStatuses={statusHistory || []}
              responseTimeField="dnsResponseTime"
              icon={<DnsIcon color="secondary" />}
              height={300}
            />

            {/* TCP Response Time Charts for each port */}
            {getTcpPorts().map(port => (
              <WorkerResponseTimeChart
                key={`tcp-${port}`}
                title={`TCP Port ${port} Response Times`}
                siteStatuses={statusHistory || []}
                responseTimeField="pingResponseTime" // This will be overridden by tcpPort prop
                tcpPort={port}
                icon={<TcpIcon color="warning" />}
                height={300}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {/* Edit Site Dialog */}
      <SiteForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        site={site}
      />

      {/* AI Analysis Modal */}
      <AiAnalysisModal
        open={isAiDialogOpen}
        onClose={handleCloseAiDialog}
        siteId={id || ''}
        siteName={site.name}
      />
    </Box>
  );
} 
