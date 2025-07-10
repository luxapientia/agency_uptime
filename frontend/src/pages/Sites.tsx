import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Switch,
  Tooltip,
  Link,
  useTheme,
  useMediaQuery,
  TablePagination,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  LanguageOutlined as LanguageIcon,
  UpdateOutlined as UpdateIcon,
  BarChartOutlined as StatsIcon,
  ErrorOutline as ErrorIcon,
  SpeedOutlined as SpeedIcon,
  ShieldOutlined as SecurityIcon,
  CloseOutlined as CloseIcon,
  SignalCellularAlt as SignalIcon,
  NetworkCheck as NetworkIcon,
  DnsOutlined as ServerIcon,
  PictureAsPdf as PdfIcon,
  NotificationsOutlined as NotificationIcon,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../store';
import {
  fetchSites,
  createSite,
  updateSite,
  deleteSite,
  setSelectedSite,
} from '../store/slices/siteSlice';
import type { Site, CreateSiteData, UpdateSiteData } from '../types/site.types';
import SiteForm from '../components/sites/SiteForm';
import NotificationSettings from '../components/sites/NotificationSettings';
import axios from '../lib/axios';
import { showToast } from '../utils/toast';
import { alpha } from '@mui/material/styles';

interface SiteStatus {
  isUp: boolean | null;
  lastChecked: string | null;
  pingUp: boolean | null;
  httpUp: boolean | null;
  uptime: {
    last24Hours: {
      overall: number;
      http: number;
      ping: number;
      totalChecks: number;
    };
  };
  ssl: {
    enabled: boolean;
    validFrom: string;
    validTo: string;
    issuer: string;
    daysUntilExpiry: number;
  } | null;
}

export default function Sites() {
  const dispatch = useDispatch<AppDispatch>();
  const { sites, isLoading, selectedSite } = useSelector((state: RootState) => state.sites);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSiteStatus, setSelectedSiteStatus] = useState<SiteStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedSiteForNotification, setSelectedSiteForNotification] = useState<Site | null>(null);

  useEffect(() => {
    dispatch(fetchSites());
  }, [dispatch]);

  const handleAddClick = () => {
    dispatch(setSelectedSite(null));
    setIsFormOpen(true);
  };

  const handleEditClick = (site: Site) => {
    dispatch(setSelectedSite(site));
    setIsFormOpen(true);
  };

  const handleDeleteClick = (site: Site) => {
    setSiteToDelete(site);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (values: CreateSiteData) => {
    if (selectedSite) {
      await dispatch(updateSite({ id: selectedSite.id, data: values as UpdateSiteData }));
    } else {
      await dispatch(createSite(values));
    }
    setIsFormOpen(false);
  };

  const handleFormClose = () => {
    dispatch(setSelectedSite(null));
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (siteToDelete) {
      await dispatch(deleteSite(siteToDelete.id));
      setIsDeleteDialogOpen(false);
      setSiteToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusClick = async (site: Site) => {
    setIsLoadingStatus(true);
    try {
      const response = await axios.get<SiteStatus>(`/sites/${site.id}/status`);
      setSelectedSiteStatus(response.data);
      setStatusDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch site status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const formatUptime = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const response = await axios.get('/sites/report', {
        responseType: 'blob', // Important for handling PDF binary data
      });

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sites-report.pdf'; // Set the download filename

      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      showToast.success('Report generated successfully');
    } catch (error) {
      console.error('Failed to generate report:', error);
      showToast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleNotificationClick = (site: Site) => {
    setSelectedSiteForNotification(site);
    setNotificationDialogOpen(true);
  };

  if (isLoading && sites.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 'bold',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
            : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Monitored Sites
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={isGeneratingReport ? <CircularProgress size={20} /> : <PdfIcon />}
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            fullWidth={isMobile}
            sx={{
              borderRadius: theme.shape.borderRadius,
              py: 1.5,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: `${theme.palette.primary.main}10`,
              }
            }}
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            fullWidth={isMobile}
            sx={{
              borderRadius: theme.shape.borderRadius,
              py: 1.5,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              boxShadow: `0 3px 5px 2px ${theme.palette.primary.main}30`,
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`
                  : `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
              }
            }}
          >
            Add New Site
          </Button>
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: theme.shape.borderRadius,
          overflow: 'auto',
          maxWidth: '100%',
          '& .MuiTableCell-root': {
            borderColor: theme.palette.divider,
            whiteSpace: 'nowrap'
          }
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.05)
            }}>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">URL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Check Interval</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Last Updated</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? sites.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : sites
            ).map((site) => (
              <TableRow
                key={site.id}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title={`${site.isActive ? 'Active' : 'Inactive'} Monitoring`}>
                      <Switch
                        checked={site.isActive}
                        onChange={() => {
                          dispatch(updateSite({
                            id: site.id,
                            data: { ...site, isActive: !site.isActive }
                          }));
                        }}
                        color="success"
                      />
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        fontSize: '1rem',
                      }}
                    >
                      {site.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                      {site.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Link
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      maxWidth: '300px',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: theme.palette.primary.dark
                      }
                    }}
                  >
                    <LanguageIcon fontSize="small" />
                    <Typography
                      noWrap
                      sx={{
                        flex: 1,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        color: 'inherit'
                      }}
                    >
                      {site.url}
                    </Typography>
                  </Link>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', color: theme.palette.text.secondary }}>
                    <SpeedIcon fontSize="small" color="inherit" />
                    Every {site.checkInterval} minute{site.checkInterval > 1 ? 's' : ''}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', color: theme.palette.text.secondary }}>
                    <UpdateIcon fontSize="small" color="inherit" />
                    {formatDate(site.updatedAt)}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="View Statistics">
                    <IconButton
                      onClick={() => handleStatusClick(site)}
                      size="small"
                      sx={{
                        mr: 1,
                        color: theme.palette.info.main,
                        '&:hover': {
                          background: alpha(theme.palette.info.main, 0.1)
                        }
                      }}
                    >
                      <StatsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Notification Settings">
                    <IconButton
                      onClick={() => handleNotificationClick(site)}
                      size="small"
                      sx={{
                        mr: 1,
                        color: theme.palette.warning.main,
                        '&:hover': { background: alpha(theme.palette.warning.main, 0.1) }
                      }}
                    >
                      <NotificationIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Site">
                    <IconButton
                      onClick={() => handleEditClick(site)}
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Site">
                    <IconButton
                      onClick={() => handleDeleteClick(site)}
                      size="small"
                      sx={{
                        ml: 1,
                        color: theme.palette.error.main,
                        '&:hover': {
                          background: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sites.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            '.MuiTablePagination-select': {
              color: theme.palette.text.primary
            },
            '.MuiTablePagination-displayedRows': {
              color: theme.palette.text.secondary
            }
          }}
        />
      </TableContainer>

      <SiteForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        site={selectedSite}
        isLoading={isLoading}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, color: theme.palette.text.primary }}>Delete Site</DialogTitle>
        <DialogContent>
          <Typography color={theme.palette.text.secondary}>
            Are you sure you want to delete "{siteToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            sx={{
              borderRadius: theme.shape.borderRadius,
              px: 3,
              color: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
            sx={{
              borderRadius: theme.shape.borderRadius,
              px: 3,
              background: theme.palette.error.main,
              '&:hover': {
                background: theme.palette.error.dark
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
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
            onClick={() => setStatusDialogOpen(false)}
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
          {isLoadingStatus ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedSiteStatus ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Current Status
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {selectedSiteStatus.isUp ? (
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
                    Last checked: {selectedSiteStatus.lastChecked ?
                      new Date(selectedSiteStatus.lastChecked).toLocaleString() :
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
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.overall)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.overall}
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
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.http)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.http}
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
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.ping)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.ping}
                      color="primary"
                      sx={{ height: 8, borderRadius: 2 }}
                    />
                  </Box>
                </Stack>
              </Box>

              {selectedSiteStatus.ssl && (
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
                          Valid until {new Date(selectedSiteStatus.ssl.validTo).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                          Issuer:
                        </Box>
                        <Typography variant="body2" sx={{ flex: 1, color: theme.palette.text.primary }}>
                          {selectedSiteStatus.ssl.issuer}
                        </Typography>
                      </Stack>
                      <Chip
                        icon={<SecurityIcon />}
                        label={`${selectedSiteStatus.ssl.daysUntilExpiry} days until expiry`}
                        color={selectedSiteStatus.ssl.daysUntilExpiry > 30 ? "success" : "warning"}
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
                Based on {selectedSiteStatus.uptime.last24Hours.totalChecks} checks in the last 24 hours
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
            onClick={() => setStatusDialogOpen(false)}
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

      <Dialog
        open={notificationDialogOpen}
        onClose={() => {
          setNotificationDialogOpen(false);
          setSelectedSiteForNotification(null);
        }}
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
              ? alpha(theme.palette.warning.main, 0.1)
              : alpha(theme.palette.warning.main, 0.1),
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <NotificationIcon color="warning" />
            <Typography variant="h6" color={theme.palette.text.primary}>Notification Settings</Typography>
          </Stack>
          <IconButton
            onClick={() => {
              setNotificationDialogOpen(false);
              setSelectedSiteForNotification(null);
            }}
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
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                Site
              </Typography>
              <Typography variant="body1" fontWeight="medium" color={theme.palette.text.primary}>
                {selectedSiteForNotification?.name}
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                {selectedSiteForNotification?.url}
              </Typography>
            </Box>

            <Divider />

            <NotificationSettings
              siteId={selectedSiteForNotification?.id || ''} />
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 