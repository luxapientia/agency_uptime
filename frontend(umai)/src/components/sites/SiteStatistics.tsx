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
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteStatus } from '../../store/slices/siteStatusSlice';
import type { RootState } from '../../store';

interface SiteStatisticsProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
}

interface StatusCardProps {
  title: string;
  status: boolean;
  icon: React.ReactNode;
  statusText: string;
  borderColor: string;
  shadowColor: string;
}

const StatusCard = ({ title, status, icon, statusText, borderColor, shadowColor }: StatusCardProps) => (
  <Card sx={{ 
    textAlign: 'center', 
    p: 3,
    height: '100%',
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
    border: `2px solid ${borderColor}`,
    borderRadius: '20px',
    boxShadow: `0 8px 25px ${shadowColor}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 35px ${shadowColor.replace('0.1', '0.2')}`,
    },
  }}>
    <CardContent sx={{ 
      pb: '16px !important',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}>
      <Box sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: status ? '#10B981' : '#EF4444',
        display: 'inline-flex',
        mb: 3,
      }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} color="#1E293B" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color={status ? '#10B981' : '#EF4444'} fontWeight={600}>
        {statusText}
      </Typography>
    </CardContent>
  </Card>
);

const formatUptime = (percentage: number) => {
  return `${percentage.toFixed(2)}%`;
};

export default function SiteStatistics({ open, onClose, siteId }: SiteStatisticsProps) {
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
          borderRadius: '24px',
          overflow: 'hidden',
          maxHeight: '90vh',
          border: '2px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 60px rgba(59, 130, 246, 0.15)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
          py: 3,
          px: 4,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: 'rgba(59, 130, 246, 0.15)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <StatsIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Site Statistics</Typography>
          {status?.workerId && (
            <Chip
              label={status.workerId === 'consensus_worker' ? 'Consensus Data' : `Worker: ${status.workerId}`}
              size="small"
              sx={{
                bgcolor: status.workerId === 'consensus_worker' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                color: status.workerId === 'consensus_worker' ? '#1D4ED8' : '#475569',
                border: `1px solid ${status.workerId === 'consensus_worker' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          )}
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            p: 1.5,
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
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        ) : status ? (
          <Stack spacing={4}>
            {/* Current Status */}
            <Box>
              <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600, mb: 3 }}>
                Current Status
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 3,
                alignItems: 'stretch',
              }}>
                <StatusCard
                  title="Overall"
                  status={status.isUp}
                  icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
                  statusText={status.isUp ? 'Online' : 'Offline'}
                  borderColor="rgba(16, 185, 129, 0.1)"
                  shadowColor="rgba(16, 185, 129, 0.1)"
                />
                <StatusCard
                  title="HTTP"
                  status={status.httpIsUp}
                  icon={<NetworkIcon sx={{ fontSize: 32 }} />}
                  statusText={status.httpIsUp ? 'Online' : 'Offline'}
                  borderColor="rgba(59, 130, 246, 0.1)"
                  shadowColor="rgba(59, 130, 246, 0.1)"
                />
                <StatusCard
                  title="Ping"
                  status={status.pingIsUp}
                  icon={<ServerIcon sx={{ fontSize: 32 }} />}
                  statusText={status.pingIsUp ? 'Online' : 'Offline'}
                  borderColor="rgba(139, 92, 246, 0.1)"
                  shadowColor="rgba(139, 92, 246, 0.1)"
                />
                <StatusCard
                  title="DNS"
                  status={status.dnsIsUp}
                  icon={<RouterIcon sx={{ fontSize: 32 }} />}
                  statusText={status.dnsIsUp ? 'Resolved' : 'Failed'}
                  borderColor="rgba(245, 158, 11, 0.1)"
                  shadowColor="rgba(245, 158, 11, 0.1)"
                />
              </Box>
              <Typography variant="body2" color="#64748B" sx={{ mt: 3, fontWeight: 500 }}>
                Last checked: {status.checkedAt ?
                  new Date(status.checkedAt).toLocaleString() :
                  'Never'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.1)', borderWidth: '2px' }} />

            {/* 24-Hour Uptime */}
            <Box>
              <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600, mb: 3 }}>
                24-Hour Uptime
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                      }}>
                        <SignalIcon fontSize="small" />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>Overall</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="#1E293B">
                      {formatUptime(status.overallUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.overallUptime ?? 0}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10B981',
                        borderRadius: 6,
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                      }}>
                        <NetworkIcon fontSize="small" />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>HTTP</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="#1E293B">
                      {formatUptime(status.httpUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.httpUptime ?? 0}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#3B82F6',
                        borderRadius: 6,
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8B5CF6',
                      }}>
                        <ServerIcon fontSize="small" />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>Ping</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="#1E293B">
                      {formatUptime(status.pingUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.pingUptime ?? 0}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#8B5CF6',
                        borderRadius: 6,
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        color: '#F59E0B',
                      }}>
                        <RouterIcon fontSize="small" />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>DNS</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="#1E293B">
                      {formatUptime(status.dnsUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.dnsUptime ?? 0}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#F59E0B',
                        borderRadius: 6,
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.1)', borderWidth: '2px' }} />

            {/* Advanced Details */}
            <Accordion sx={{
              '& .MuiAccordion-root': {
                border: '2px solid rgba(59, 130, 246, 0.1)',
                borderRadius: '16px',
                overflow: 'hidden',
              },
              '& .MuiAccordionSummary-root': {
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                },
              },
              '& .MuiAccordionDetails-root': {
                bgcolor: 'rgba(248, 250, 252, 0.5)',
              },
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#3B82F6' }} />}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>Advanced Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={4}>
                  {/* DNS Information */}
                  {status.dnsNameservers && status.dnsNameservers.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600, mb: 2 }}>
                        DNS Information
                      </Typography>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="body1" fontWeight={600} color="#1E293B" gutterBottom>
                            Nameservers:
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {status.dnsNameservers.map((ns, index) => (
                              <Chip 
                                key={index} 
                                label={ns} 
                                size="small" 
                                sx={{
                                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                                  color: '#1D4ED8',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  borderRadius: '12px',
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                        {status.dnsRecords?.addresses && status.dnsRecords.addresses.length > 0 && (
                          <Box>
                            <Typography variant="body1" fontWeight={600} color="#1E293B" gutterBottom>
                              IP Addresses:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                              {status.dnsRecords.addresses.map((ip, index) => (
                                <Chip 
                                  key={index} 
                                  label={ip} 
                                  size="small" 
                                  sx={{
                                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                                    color: '#7C3AED',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                  }}
                                />
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
                      <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600, mb: 2 }}>
                        TCP Port Checks
                      </Typography>
                      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
                        {status.tcpChecks.map((tcpCheck, index) => (
                          <Card sx={{ 
                            p: 3, 
                            flex: '1 1 220px', 
                            minWidth: 180,
                            background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                            border: `2px solid ${tcpCheck.isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                            borderRadius: '16px',
                            boxShadow: `0 6px 20px ${tcpCheck.isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 25px ${tcpCheck.isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            },
                          }} key={index}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Box sx={{
                                p: 1.5,
                                borderRadius: '12px',
                                bgcolor: tcpCheck.isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: tcpCheck.isUp ? '#10B981' : '#EF4444',
                              }}>
                                <StorageIcon sx={{ fontSize: 24 }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight={700} color="#1E293B">
                                  Port {tcpCheck.port}
                                </Typography>
                                <Typography variant="body2" color={tcpCheck.isUp ? '#10B981' : '#EF4444'} fontWeight={600}>
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
                <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.1)', borderWidth: '2px' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600, mb: 2 }}>
                    SSL Certificate
                  </Typography>
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                      }}>
                        <SecurityIcon fontSize="small" />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        Valid until {new Date(status.sslValidTo ?? '').toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Issuer:
                      </Typography>
                      <Typography variant="body1" sx={{ flex: 1, color: '#1E293B', fontWeight: 500 }}>
                        {status.sslIssuer}
                      </Typography>
                    </Stack>
                    <Chip
                      icon={<SecurityIcon />}
                      label={`${status.sslDaysUntilExpiry} days until expiry`}
                      sx={{
                        bgcolor: status.sslDaysUntilExpiry && status.sslDaysUntilExpiry > 30 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(245, 158, 11, 0.1)',
                        color: status.sslDaysUntilExpiry && status.sslDaysUntilExpiry > 30 
                          ? '#166534' 
                          : '#92400E',
                        border: `1px solid ${status.sslDaysUntilExpiry && status.sslDaysUntilExpiry > 30 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(245, 158, 11, 0.2)'}`,
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    />
                  </Stack>
                </Box>
              </>
            )}

            <Typography variant="body2" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#64748B',
              fontWeight: 500,
              fontStyle: 'italic',
            }}>
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
              py: 6,
              px: 4,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(59, 130, 246, 0.1)',
            }}
          >
            <Box sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              mb: 3,
            }}>
              <NoDataIcon sx={{ fontSize: 64 }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ color: '#1E293B', fontWeight: 700, mb: 2 }}
            >
              No Status Data Available
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                maxWidth: 400,
                color: '#64748B',
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              We haven't collected any monitoring data for this site yet. Data will appear here after the first check is completed.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        p: 4, 
        pt: 2,
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
        borderTop: '2px solid rgba(59, 130, 246, 0.1)',
      }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '16px',
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 