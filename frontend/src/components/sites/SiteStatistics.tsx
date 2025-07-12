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
} from '@mui/material';
import {
  BarChartOutlined as StatsIcon,
  CloseOutlined as CloseIcon,
  SignalCellularAlt as SignalIcon,
  NetworkCheck as NetworkIcon,
  DnsOutlined as ServerIcon,
  ShieldOutlined as SecurityIcon,
  UpdateOutlined as UpdateIcon,
  ErrorOutline as ErrorIcon,
  TimelineOutlined as TimelineIcon,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
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
      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : statuses[siteId] ? (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                Current Status
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {statuses[siteId].isUp ? (
                  <Chip
                    icon={<SignalIcon />}
                    label="Online"
                    color="success"
                    sx={{
                      '& .MuiChip-icon': { fontSize: 20 }
                    }}
                  />
                ) : (
                  <Chip
                    icon={<ErrorIcon />}
                    label="Offline"
                    color="error"
                    sx={{
                      '& .MuiChip-icon': { fontSize: 20 }
                    }}
                  />
                )}
                <Typography variant="body2" color={theme.palette.text.secondary}>
                  Last checked: {statuses[siteId].checkedAt ?
                    new Date(statuses[siteId].checkedAt).toLocaleString() :
                    'Never'}
                </Typography>
              </Stack>
            </Box>

            <Divider />

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
                      {formatUptime(statuses[siteId].overallUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={statuses[siteId].overallUptime}
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
                      {formatUptime(statuses[siteId].httpUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={statuses[siteId].httpUptime ?? 0}
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
                      {formatUptime(statuses[siteId].pingUptime ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={statuses[siteId].pingUptime ?? 0}
                    color="primary"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* <Box>
              <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimelineIcon fontSize="small" />
                  <span>Status History</span>
                </Stack>
              </Typography>
              <Box sx={{ 
                height: 200, 
                width: '100%', 
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography color={theme.palette.text.secondary}>
                  Please install recharts to display the graph
                </Typography>
              </Box>
            </Box> */}

            {statuses[siteId].hasSsl && (
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
                        Valid until {new Date(statuses[siteId].sslValidTo ?? '').toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                        Issuer:
                      </Box>
                      <Typography variant="body2" sx={{ flex: 1, color: theme.palette.text.primary }}>
                        {statuses[siteId].sslIssuer}
                      </Typography>
                    </Stack>
                    <Chip
                      icon={<SecurityIcon />}
                      label={`${statuses[siteId].sslDaysUntilExpiry} days until expiry`}
                      color={statuses[siteId].sslDaysUntilExpiry && statuses[siteId].sslDaysUntilExpiry > 30 ? "success" : "warning"}
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
              Based on {statuses[siteId].overallUptime} checks in the last 24 hours
            </Typography>
          </Stack>
        ) : (
          <Typography color={theme.palette.text.secondary}>
            No status information available
          </Typography>
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