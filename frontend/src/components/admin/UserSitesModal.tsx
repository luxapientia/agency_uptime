import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Language as LanguageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface MonitoredSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  checkInterval: number;
}

interface UserSitesModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function UserSitesModal({
  open,
  onClose,
  userId,
}: UserSitesModalProps) {
  const theme = useTheme();
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [sitesLoading, setSitesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
    ) : (
      <CancelIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? theme.palette.success.main : theme.palette.error.main;
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getCheckIntervalText = (interval: number) => {
    if (interval === 0.5) return '30s';
    if (interval === 1) return '1m';
    return `${interval}m`;
  };

  // Fetch sites when modal opens
  useEffect(() => {
    if (open && userId) {
      fetchUserSites();
    }
  }, [open, userId]);

  const fetchUserSites = async () => {
    if (!userId) return;

    try {
      setSitesLoading(true);
      setError(null);

      // Import adminService dynamically to avoid circular dependency
      const { default: adminService } = await import('../../services/admin.service');
      const response = await adminService.getUserById(userId);

      if (response.data.sites) {
        // Map sites to include checkInterval with a default value if not present
        const sitesWithInterval = response.data.sites.map((site: any) => ({
          ...site,
          checkInterval: site.checkInterval || 1 // Default to 1 minute if not specified
        }));
        setSites(sitesWithInterval);
      } else {
        setSites([]);
      }

      // Set user name from the response
      if (response.data.firstName && response.data.lastName) {
        setUserName(`${response.data.firstName} ${response.data.lastName}`);
      }
    } catch (err) {
      console.error('Error fetching user sites:', err);
      setError('Failed to fetch user sites. Please try again.');
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Monitored Sites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userName}'s websites
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {sitesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading sites...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            color: theme.palette.error.main
          }}>
            <Typography variant="h6" gutterBottom>
              Error Loading Sites
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Box>
        ) : sites.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            color: theme.palette.text.secondary
          }}>
            <LanguageIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              No Sites Monitored
            </Typography>
            <Typography variant="body2">
              This user hasn't added any websites for monitoring yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '& th': {
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    padding: '12px 16px',
                  }
                }}>
                  <TableCell sx={{ width: '60px', textAlign: 'center' }}>#</TableCell>
                  <TableCell>Site Name</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Check Interval</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Status</TableCell>
                  <TableCell align="center" sx={{ width: '100px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sites.map((site: MonitoredSite, index: number) => (
                  <TableRow
                    key={site.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      },
                      '& td': {
                        padding: '12px 16px',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      },
                      '&:last-child td': {
                        borderBottom: 'none',
                      }
                    }}
                  >
                    <TableCell sx={{
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      textAlign: 'center',
                      width: '60px'
                    }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.primary.main,
                          }}
                        >
                          <LanguageIcon fontSize="small" />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {site.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          backgroundColor: alpha(theme.palette.grey[100], 0.8),
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          color: theme.palette.text.secondary,
                          border: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`,
                        }}
                      >
                        {site.url}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<ScheduleIcon fontSize="small" />}
                        label={getCheckIntervalText(site.checkInterval)}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: theme.palette.info.main,
                          borderColor: alpha(theme.palette.info.main, 0.3),
                          backgroundColor: alpha(theme.palette.info.main, 0.08),
                          fontSize: '0.75rem',
                          height: '24px',
                          borderRadius: '12px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {getStatusIcon(site.isActive)}
                        <Chip
                          label={getStatusText(site.isActive)}
                          size="small"
                          variant="outlined"
                          sx={{
                            color: getStatusColor(site.isActive),
                            borderColor: alpha(getStatusColor(site.isActive), 0.3),
                            backgroundColor: alpha(getStatusColor(site.isActive), 0.08),
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '24px',
                            borderRadius: '12px',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View site details">
                        <IconButton
                          size="small"
                          sx={{
                            color: theme.palette.info.main,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                            },
                          }}
                        >
                          <LanguageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        py: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total sites: {sites.length}
          </Typography>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: alpha(theme.palette.primary.main, 0.5),
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
} 