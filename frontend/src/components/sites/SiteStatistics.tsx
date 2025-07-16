import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  useTheme,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  BarChartOutlined as StatsIcon,
  CloseOutlined as CloseIcon,
  SignalCellularAlt as SignalIcon,
  NetworkCheck as NetworkIcon,
  DnsOutlined as ServerIcon,
  ShieldOutlined as SecurityIcon,
  UpdateOutlined as UpdateIcon,
  DataUsageOutlined as NoDataIcon,
  Router as RouterIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteStatus } from '../../store/slices/siteStatusSlice';
import type { RootState } from '../../store';

interface SiteStatisticsProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
}

const formatUptime = (percentage: number) => {
  return `${percentage.toFixed(2)}%`;
};

export default function SiteStatistics({ open, onClose, siteId }: SiteStatisticsProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const statuses = useSelector((state: RootState) => state.siteStatus.statuses);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!open || !siteId) return;
      
      setIsLoading(true);
      try {
        dispatch(fetchSiteStatus(siteId) as any);
      } catch (error) {
        console.error('Failed to fetch site status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [open, siteId]);

  const status = statuses[siteId];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.main, 0.1),
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <StatsIcon color="primary" />
          <Typography variant="h6" color={theme.palette.text.primary}>Site Statistics</Typography>
          {status?.workerId && (
            <Chip
              label={status.workerId === 'consensus_worker' ? 'Consensus Data' : `Worker: ${status.workerId}`}
              size="small"
              color={status.workerId === 'consensus_worker' ? 'primary' : 'default'}
              variant="outlined"
            />
          )}
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              background: alpha(theme.palette.text.secondary, 0.1)
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : status ? (
          <Stack spacing={3}>
            {/* Current Status */}
            <Box>
              <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                Current Status
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1, flex: '1 1 150px', minWidth: 120 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    {status.isUp ? (
                      <CheckCircleIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
                    )}
                    <Typography variant="body2" fontWeight="medium">
                      Overall
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.isUp ? 'Online' : 'Offline'}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1, flex: '1 1 150px', minWidth: 120 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <NetworkIcon color={status.httpIsUp ? 'success' : 'error'} sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      HTTP
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.httpIsUp ? 'Online' : 'Offline'}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1, flex: '1 1 150px', minWidth: 120 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <ServerIcon color={status.pingIsUp ? 'success' : 'error'} sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      Ping
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.pingIsUp ? 'Online' : 'Offline'}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1, flex: '1 1 150px', minWidth: 120 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <RouterIcon color={status.dnsIsUp ? 'success' : 'error'} sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight="medium">
                      DNS
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.dnsIsUp ? 'Resolved' : 'Failed'}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
              <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mt: 2 }}>
                Last checked: {status.checkedAt ?
                  new Date(status.checkedAt).toLocaleString() :
                  'Never'}
              </Typography>
            </Box>

            <Divider />

            {/* 24-Hour Uptime */}
            <Box>
              <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom sx={{ mb: 2 }}>
                24-Hour Uptime
              </Typography>
              <Stack spacing={2.5}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SignalIcon color="success" fontSize="small" />
                      <Typography variant="body2" color={theme.palette.text.primary}>Overall</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="medium" color={theme.palette.text.primary}>
                      {formatUptime(status.overallUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.overallUptime ?? 0}
                    color="success"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <NetworkIcon color="info" fontSize="small" />
                      <Typography variant="body2" color={theme.palette.text.primary}>HTTP</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="medium" color={theme.palette.text.primary}>
                      {formatUptime(status.httpUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.httpUptime ?? 0}
                    color="info"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ServerIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color={theme.palette.text.primary}>Ping</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="medium" color={theme.palette.text.primary}>
                      {formatUptime(status.pingUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.pingUptime ?? 0}
                    color="primary"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RouterIcon color="secondary" fontSize="small" />
                      <Typography variant="body2" color={theme.palette.text.primary}>DNS</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="medium" color={theme.palette.text.primary}>
                      {formatUptime(status.dnsUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.dnsUptime ?? 0}
                    color="secondary"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Advanced Details */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Advanced Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {/* DNS Information */}
                  {status.dnsNameservers && status.dnsNameservers.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                        DNS Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Nameservers:
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {status.dnsNameservers.map((ns, index) => (
                              <Chip key={index} label={ns} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                        {status.dnsRecords?.addresses && status.dnsRecords.addresses.length > 0 && (
                          <Box>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              IP Addresses:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                              {status.dnsRecords.addresses.map((ip, index) => (
                                <Chip key={index} label={ip} size="small" color="primary" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* TCP Checks */}
                  {status.tcpChecks && status.tcpChecks.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                        TCP Port Checks
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                        {status.tcpChecks.map((tcpCheck, index) => (
                          <Card variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 150 }} key={index}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <StorageIcon 
                                color={tcpCheck.isUp ? 'success' : 'error'} 
                                sx={{ fontSize: 24 }} 
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  Port {tcpCheck.port}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {tcpCheck.isUp ? 'Open' : 'Closed'}
                                </Typography>
                              </Box>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* SSL Certificate */}
            {status.hasSsl && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom sx={{ mb: 1 }}>
                    SSL Certificate
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SecurityIcon color="success" fontSize="small" />
                      <Typography variant="body2" color={theme.palette.text.primary}>
                        Valid until {new Date(status.sslValidTo ?? '').toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                        Issuer:
                      </Box>
                      <Typography variant="body2" sx={{ flex: 1, color: theme.palette.text.primary }}>
                        {status.sslIssuer}
                      </Typography>
                    </Stack>
                    <Chip
                      icon={<SecurityIcon />}
                      label={`${status.sslDaysUntilExpiry} days until expiry`}
                      color={status.sslDaysUntilExpiry && status.sslDaysUntilExpiry > 30 ? "success" : "warning"}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 2
                      }}
                    />
                  </Stack>
                </Box>
              </>
            )}

            <Typography variant="caption" color={theme.palette.text.secondary} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <UpdateIcon fontSize="small" />
              Based on consensus monitoring data from multiple workers
            </Typography>
          </Stack>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 4,
              px: 2,
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
            }}
          >
            <NoDataIcon 
              sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.primary.main, 0.5),
                mb: 2 
              }} 
            />
            <Typography 
              variant="h6" 
              color={theme.palette.text.primary}
              gutterBottom
            >
              No Status Data Available
            </Typography>
            <Typography 
              variant="body2" 
              color={theme.palette.text.secondary}
              sx={{ maxWidth: 300 }}
            >
              We haven't collected any monitoring data for this site yet. Data will appear here after the first check is completed.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: theme.shape.borderRadius,
            px: 3,
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 