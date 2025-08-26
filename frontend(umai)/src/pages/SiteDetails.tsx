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
  const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);

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

  const handleSendMonthlyReport = useCallback(async () => {
    if (!site) return;
    setMonthlyReportLoading(true);
    try {
      await axios.post(`/sites/${site.id}/send-monthly-report`);
      // Show success message - you can replace this with your preferred notification system
      alert('Monthly report sent successfully! Check your email.');
    } catch (error: any) {
      console.error('Failed to send monthly report:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send monthly report.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setMonthlyReportLoading(false);
    }
  }, [site]);

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
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 2, sm: 3 }}
        >
          {/* Left Section: Back Button + Site Name */}
          <Stack
            direction="row"
            alignItems="center"
            gap={{ xs: 1.5, sm: 2 }}
            sx={{
              flexShrink: 1,
              minWidth: 0,
              justifyContent: { xs: 'flex-start', sm: 'center', md: 'flex-start' }
            }}
          >
            <IconButton
              onClick={() => navigate('/sites')}
              sx={{
                p: { xs: 1, sm: 1.25 },
                color: '#64748B',
                bgcolor: 'rgba(100, 116, 139, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: 'rgba(100, 116, 139, 0.15)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(100, 116, 139, 0.2)',
                },
                flexShrink: 0,
              }}
              size="medium"
              aria-label="Back to Sites"
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: { xs: '100%', sm: 400, md: 500 },
                textAlign: { xs: 'center', sm: 'center', md: 'left' },
                flex: 1,
              }}
            >
              {site.name}
            </Typography>
          </Stack>

          {/* Right Section: Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 2, md: 2 }}
            alignItems="stretch"
            justifyContent={{ xs: 'center', sm: 'center', md: 'flex-end' }}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            {/* Monthly Report Button */}
            <MuiTooltip title="Send monthly report via email" arrow>
              <span>
                <Button
                  startIcon={monthlyReportLoading ? <CircularProgress size={18} color="inherit" /> : <AssessmentIcon />}
                  variant="outlined"
                  onClick={handleSendMonthlyReport}
                  disabled={monthlyReportLoading || !site.monthlyReport}
                  aria-label="Send Monthly Report"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    py: { xs: 1.25, sm: 1.5 },
                    px: { xs: 2.5, sm: 3 },
                    borderRadius: '14px',
                    whiteSpace: 'nowrap',
                    opacity: site.monthlyReport ? 1 : 0.6,
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                    minHeight: { xs: 48, sm: 52 },
                    minWidth: { xs: 'auto', sm: 180 },
                    '&:hover': {
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {site.monthlyReport ? 'Send Monthly Report' : 'Monthly Reports Disabled'}
                </Button>
              </span>
            </MuiTooltip>

            {/* PDF Download Button */}
            <MuiTooltip title="Download a PDF report of this site" arrow>
              <span>
                <Button
                  startIcon={pdfLoading ? <CircularProgress size={18} color="inherit" /> : <PdfIcon />}
                  variant="contained"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  aria-label="Download PDF Report"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    py: { xs: 1.25, sm: 1.5 },
                    px: { xs: 2.5, sm: 3 },
                    borderRadius: '14px',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
                    minHeight: { xs: 48, sm: 52 },
                    minWidth: { xs: 'auto', sm: 160 },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(6, 182, 212, 0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(156, 163, 175, 0.5)',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Download PDF Report
                </Button>
              </span>
            </MuiTooltip>

            {/* Edit Site Button */}
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={handleEditClick}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                py: { xs: 1.25, sm: 1.5 },
                px: { xs: 2.5, sm: 3 },
                borderRadius: '14px',
                whiteSpace: 'nowrap',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                color: '#3B82F6',
                minHeight: { xs: 48, sm: 52 },
                minWidth: { xs: 'auto', sm: 120 },
                '&:hover': {
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              aria-label="Edit Site"
            >
              Edit Site
            </Button>
          </Stack>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#3B82F6' }} />
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Consensus Status Card */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'visible',
              border: `2px solid ${siteStatus?.isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '24px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
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
                              fontSize: { xs: 48, sm: 56 },
                              color: '#10B981',
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
                              fontSize: { xs: 48, sm: 56 },
                              color: '#EF4444',
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
                            variant="h4"
                            sx={{
                              fontSize: { xs: '1.4rem', sm: '1.8rem' },
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              color: siteStatus?.isUp
                                ? '#10B981'
                                : '#EF4444',
                            }}
                          >
                            {siteStatus?.isUp ? 'Site is Online' : 'Site is Offline'}
                          </Typography>
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
                            border: '2px solid rgba(6, 182, 212, 0.3)',
                            color: '#06B6D4',
                            borderRadius: '16px',
                            fontWeight: 600,
                            py: 1.5,
                            px: 3,
                            '&:hover': {
                              borderColor: '#06B6D4',
                              backgroundColor: 'rgba(6, 182, 212, 0.05)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                          fontWeight: 600,
                          py: 1.5,
                          px: 3,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#1E293B' }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3B82F6',
                    }}>
                      <AssessmentIcon />
                    </Box>
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
                        p: 3,
                        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                        border: `2px solid ${siteStatus?.pingIsUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`,
                        borderRadius: '20px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            bgcolor: siteStatus?.pingIsUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                            color: siteStatus?.pingIsUp ? '#10B981' : '#9CA3AF',
                          }}>
                            <PingIcon />
                          </Box>
                          {getStatusIcon(siteStatus?.pingIsUp, 20)}
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          Ping
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color={siteStatus?.pingIsUp ? '#10B981' : '#64748B'}>
                          {siteStatus?.pingIsUp === undefined ? 'Unknown' : (siteStatus.pingIsUp ? 'Online' : 'Offline')}
                        </Typography>
                      </Stack>
                    </Card>

                    {/* HTTP Status */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 3,
                        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                        border: `2px solid ${siteStatus?.httpIsUp ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`,
                        borderRadius: '20px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            bgcolor: siteStatus?.httpIsUp ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                            color: siteStatus?.httpIsUp ? '#3B82F6' : '#9CA3AF',
                          }}>
                            <HttpIcon />
                          </Box>
                          {getStatusIcon(siteStatus?.httpIsUp, 20)}
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          HTTP
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color={siteStatus?.httpIsUp ? '#3B82F6' : '#64748B'}>
                          {siteStatus?.httpIsUp === undefined ? 'Unknown' : (siteStatus.httpIsUp ? 'Online' : 'Offline')}
                        </Typography>
                      </Stack>
                    </Card>

                    {/* DNS Status */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 3,
                        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                        border: `2px solid ${siteStatus?.dnsIsUp ? 'rgba(139, 92, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`,
                        borderRadius: '20px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            bgcolor: siteStatus?.dnsIsUp ? 'rgba(139, 92, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                            color: siteStatus?.dnsIsUp ? '#8B5CF6' : '#9CA3AF',
                          }}>
                            <DnsIcon />
                          </Box>
                          {getStatusIcon(siteStatus?.dnsIsUp, 20)}
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          DNS
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color={siteStatus?.dnsIsUp ? '#8B5CF6' : '#64748B'}>
                          {siteStatus?.dnsIsUp === undefined ? 'Unknown' : (siteStatus.dnsIsUp ? 'Online' : 'Offline')}
                        </Typography>
                      </Stack>
                    </Card>

                    {/* TCP Status Summary */}
                    <Card
                      sx={{
                        flex: 1,
                        p: 3,
                        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                        border: '2px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: '20px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            bgcolor: 'rgba(6, 182, 212, 0.1)',
                            color: '#06B6D4',
                          }}>
                            <TcpIcon />
                          </Box>
                          <Badge
                            badgeContent={siteStatus?.tcpChecks?.length || 0}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.65rem',
                                backgroundColor: '#06B6D4',
                                color: 'white',
                              }
                            }}
                          >
                            <InfoIcon sx={{ fontSize: 20, color: '#06B6D4' }} />
                          </Badge>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          TCP Ports
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="#1E293B">
                          {siteStatus?.tcpChecks?.filter(check => check.isUp).length || 0}/
                          {siteStatus?.tcpChecks?.length || 0} Open
                        </Typography>
                        <Typography variant="body2" color="#64748B" sx={{ textAlign: 'center' }}>
                          {tcpPorts.join(', ') || 'None'}
                        </Typography>
                      </Stack>
                    </Card>
                  </Stack>
                </Stack>

                <Divider />

                {/* Uptime Statistics */}
                <Stack spacing={3}>
                  <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#1E293B' }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3B82F6',
                    }}>
                      <SpeedIcon />
                    </Box>
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
                    spacing={3}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ width: '100%' }}
                  >
                    <Stack spacing={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Overall
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">
                          {(siteStatus?.overallUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.overallUptime ?? 0}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: 'rgba(156, 163, 175, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Ping
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">
                          {(siteStatus?.pingUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.pingUptime ?? 0}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: 'rgba(156, 163, 175, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                          HTTP
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">
                          {(siteStatus?.httpUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.httpUptime ?? 0}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: 'rgba(156, 163, 175, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          }
                        }}
                      />
                    </Stack>

                    <Stack spacing={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                          DNS
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">
                          {(siteStatus?.dnsUptime ?? 0).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={siteStatus?.dnsUptime ?? 0}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: 'rgba(156, 163, 175, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
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
                    variant="outlined"
                    sx={{
                      textTransform: 'none',
                      color: '#3B82F6',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '16px',
                      py: 1.5,
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
            <Stack spacing={4}>
              <Stack direction="row" spacing={3} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                }}>
                  <TimelineIcon
                    sx={{
                      fontSize: { xs: 28, sm: 32 },
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.6 },
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.4rem', sm: '1.8rem' },
                    fontWeight: 700,
                    color: '#1E293B',
                  }}
                >
                  Worker Response Times
                </Typography>
                <Box sx={{ flexGrow: 1 }} />

                {/* Time Range Selector */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="time-range-label" sx={{ color: '#64748B', fontWeight: 600 }}>Time Range</InputLabel>
                    <Select
                      labelId="time-range-label"
                      value={timeRange}
                      label="Time Range"
                      onChange={handleTimeRangeChange}
                      disabled={isGraphLoading}
                      sx={{
                        borderRadius: '16px',
                        border: '2px solid rgba(59, 130, 246, 0.1)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3B82F6',
                            borderWidth: '2px',
                          },
                          boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
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
                    <CircularProgress size={24} sx={{ color: '#3B82F6' }} />
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
