import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NetworkCheck as NetworkIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  AccessTime as TimeIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as CancelIcon,
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
  Download as PdfIcon,
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
import axios from '../lib/axios';

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
  const [timeRange, setTimeRange] = useState(24); // Default to 24 hours
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const loadSiteData = async () => {
      if (!id) return;

      const isInitialLoad = isLoading;
      if (!isInitialLoad) {
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
        if (isInitialLoad) {
          setIsLoading(false);
        }
        setIsGraphLoading(false);
      }
    };

    loadSiteData();
  }, [id, dispatch, timeRange, isLoading]);

  const handleEditClick = useCallback(() => {
    if (site) {
      dispatch(setSelectedSite(site));
      setIsFormOpen(true);
    }
  }, [site, dispatch]);

  const handleFormSubmit = useCallback(async (values: CreateSiteData) => {
    if (site) {
      await dispatch(updateSite({ id: site.id, data: values }));
    }
    setIsFormOpen(false);
  }, [site, dispatch]);

  const handleFormClose = useCallback(() => {
    dispatch(setSelectedSite(null));
    setIsFormOpen(false);
  }, [dispatch]);

  const handleAiAnalysis = useCallback(() => {
    setIsAiDialogOpen(true);
  }, []);

  const handleCloseAiDialog = useCallback(() => {
    setIsAiDialogOpen(false);
  }, []);

  const handleTimeRangeChange = useCallback((event: any) => {
    setTimeRange(event.target.value);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.get(`/reports/pdf?siteId=${id}&tz=${encodeURIComponent(tz)}`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Try to get filename from Content-Disposition header
      console.log(response.data);
      const blob = new Blob([response.data], { type: 'application/pdf' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
    } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Failed to download PDF report.');
  } finally {
    setPdfLoading(false);
  }
}, [id]);

// Memoized status history to prevent unnecessary re-renders
const memoizedStatusHistory = useMemo(() => statusHistory || [], [statusHistory]);

// Memoized TCP ports calculation
const tcpPorts = useMemo(() => {
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
}, [statusHistory]);

// Memoize all chart components (Ping, HTTP, DNS, TCP)
const chartComponents = useMemo(() => [
  <WorkerResponseTimeChart
    key="ping"
    title="Ping Response Times"
    siteStatuses={memoizedStatusHistory}
    responseTimeField="pingResponseTime"
    icon={<PingIcon color="primary" />}
    height={300}
  />,
  <WorkerResponseTimeChart
    key="http"
    title="HTTP Response Times"
    siteStatuses={memoizedStatusHistory}
    responseTimeField="httpResponseTime"
    icon={<HttpIcon color="info" />}
    height={300}
  />,
  <WorkerResponseTimeChart
    key="dns"
    title="DNS Response Times"
    siteStatuses={memoizedStatusHistory}
    responseTimeField="dnsResponseTime"
    icon={<DnsIcon color="secondary" />}
    height={300}
  />,
  ...tcpPorts.map((port: number) => (
    <WorkerResponseTimeChart
      key={`tcp-${port}`}
      title={`TCP Port ${port} Response Times`}
      siteStatuses={memoizedStatusHistory}
      responseTimeField="pingResponseTime" // This will be overridden by tcpPort prop
      tcpPort={port}
      icon={<TcpIcon color="warning" />}
      height={300}
    />
  ))
], [memoizedStatusHistory, tcpPorts]);

// Memoized helper function to get status color
const getStatusColor = useCallback((isUp: boolean | undefined) => {
  if (isUp === undefined) return theme.palette.grey[500];
  return isUp ? theme.palette.success.main : theme.palette.error.main;
}, [theme.palette.grey, theme.palette.success.main, theme.palette.error.main]);

// Memoized helper function to get status icon
const getStatusIcon = useCallback((isUp: boolean | undefined, size = 20) => {
  if (isUp === undefined) {
    return <InfoIcon sx={{ fontSize: size, color: theme.palette.grey[500] }} />;
  }
  return isUp
    ? <CheckIcon sx={{ fontSize: size, color: theme.palette.success.main }} />
    : <CancelIcon sx={{ fontSize: size, color: theme.palette.error.main }} />;
}, [theme.palette.grey, theme.palette.success.main, theme.palette.error.main]);

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
    <Box sx={{ mb: { xs: 2, sm: 4 } }}>
      <Stack
        direction="row"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 1, minWidth: 0 }}>
          <IconButton
            onClick={() => navigate('/sites')}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
              mr: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 },
            }}
            size="large"
            aria-label="Back to Sites"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2.2rem' },
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
                : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              maxWidth: { xs: '100%', sm: 500 },
            }}
          >
            {site.name}
          </Typography>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <MuiTooltip title="Download a PDF report of this site" arrow>
            <span>
              <Button
                startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                variant="contained"
                color="info"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                aria-label="Download PDF Report"
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  py: 1.3,
                  borderRadius: 2,
                  mb: { xs: 1, sm: 0 },
                  whiteSpace: 'nowrap',
                  boxShadow: pdfLoading ? 2 : undefined,
                }}
              >
                Download PDF Report
              </Button>
            </span>
          </MuiTooltip>
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={handleEditClick}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              py: 1.3,
              borderRadius: 2,
              whiteSpace: 'nowrap',
            }}
            aria-label="Edit Site"
          >
            Edit Site
          </Button>
        </Stack>
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
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="flex-start"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  sx={{ width: '100%' }}
                >
                  {/* Status Indicator + Label + Time */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    flexWrap="nowrap"
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        flexShrink: 0,
                        pt: 2
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
                    </Box>

                    <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="nowrap"
                        sx={{ overflow: 'hidden', pt: 2 }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontSize: { xs: '1.2rem', sm: '1.5rem' },
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: siteStatus?.isUp
                              ? theme.palette.success.main
                              : theme.palette.error.main,
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
                            },
                          }}
                        >
                          <Chip
                            label={
                              siteStatus?.workerId === 'consensus_worker'
                                ? 'Consensus Status'
                                : `Worker: ${siteStatus?.workerId}`
                            }
                            size="small"
                            sx={{
                              whiteSpace: 'nowrap',
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
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <TimeIcon sx={{ fontSize: 16 }} />
                        Last checked:{' '}
                        {siteStatus?.checkedAt
                          ? new Date(siteStatus.checkedAt).toLocaleString()
                          : 'Never'}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Action Buttons */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-around"
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      pt: 2,
                      flexShrink: 0,
                    }}
                  >
                    <MuiTooltip title="AI Health Analysis">
                      <Button
                        onClick={handleAiAnalysis}
                        startIcon={<AiIcon />}
                        variant="outlined"
                        sx={{
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          minWidth: 0,
                          maxWidth: '100%',
                          borderColor: theme.palette.info.main,
                          color: theme.palette.info.main,
                          '&:hover': {
                            borderColor: theme.palette.info.dark,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                          },
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
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        minWidth: 0,
                        maxWidth: '100%',
                        borderRadius: 1,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                        },
                      }}
                    >
                      Visit Site
                    </Button>
                  </Stack>
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
                        {tcpPorts.join(', ') || 'None'}
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
                  {timeRange === 1 ? '1-Hour' :
                    timeRange === 6 ? '6-Hour' :
                      timeRange === 12 ? '12-Hour' :
                        timeRange === 24 ? '24-Hour' :
                          timeRange === 48 ? '48-Hour' :
                            timeRange === 72 ? '3-Day' :
                              timeRange === 168 ? '7-Day' : `${timeRange}-Hour`} Uptime Statistics
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ width: '100%' }}
                >
                  <Stack spacing={1} sx={{ flex: '1 1 250px', minWidth: 250 }}>
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

                  <Stack spacing={1} sx={{ flex: '1 1 250px', minWidth: 250 }}>
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

                  <Stack spacing={1} sx={{ flex: '1 1 250px', minWidth: 250 }}>
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

                  <Stack spacing={1} sx={{ flex: '1 1 250px', minWidth: 250 }}>
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
        {memoizedStatusHistory.length > 0 && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
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

              {/* Time Range Selector */}
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="time-range-label">Time Range</InputLabel>
                  <Select
                    labelId="time-range-label"
                    value={timeRange}
                    label="Time Range"
                    onChange={handleTimeRangeChange}
                    disabled={isGraphLoading}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value={1}>1 Hour</MenuItem>
                    <MenuItem value={6}>6 Hours</MenuItem>
                    <MenuItem value={12}>12 Hours</MenuItem>
                    <MenuItem value={24}>24 Hours</MenuItem>
                    <MenuItem value={48}>48 Hours</MenuItem>
                    <MenuItem value={72}>3 Days</MenuItem>
                    <MenuItem value={168}>7 Days</MenuItem>
                  </Select>
                </FormControl>
                {isGraphLoading && (
                  <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                )}
              </Stack>
            </Stack>

            {/* Ping Response Time Chart */}
            {chartComponents}
          </Stack>
        )}
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
