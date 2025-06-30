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
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchSites,
  createSite,
  updateSite,
  deleteSite,
  setSelectedSite,
} from '../../store/slices/siteSlice';
import type { Site, CreateSiteData, UpdateSiteData } from '../../types/site.types';
import SiteForm from '../../components/sites/SiteForm';
import axios from '../../lib/axios';

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
            ? 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)'
            : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Monitored Sites
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            py: 1.5,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
              : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)'
                : 'linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)',
            }
          }}
        >
          Add New Site
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        elevation={2}
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          '& .MuiTableCell-root': {
            borderColor: theme.palette.divider
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ 
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(33, 150, 243, 0.05)'
            }}>
              <TableCell sx={{ fontWeight: 'bold' }} align="center" >Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">URL</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Check Interval</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Last Updated</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(33, 150, 243, 0.05)'
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
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    <LanguageIcon fontSize="small" />
                    {site.url}
                  </Link>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <SpeedIcon fontSize="small" color="action" />
                    Every {site.checkInterval} minute{site.checkInterval > 1 ? 's' : ''}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <UpdateIcon fontSize="small" color="action" />
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
                          background: `${theme.palette.info.main}15`
                        }
                      }}
                    >
                      <StatsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Site">
                    <IconButton
                      onClick={() => handleEditClick(site)}
                      size="small"
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { 
                          background: `${theme.palette.primary.main}15`
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
                          background: `${theme.palette.error.main}15`
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
            borderRadius: 2,
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Delete Site</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{siteToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
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
              borderRadius: 2,
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
            borderRadius: 2,
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
              ? 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(33, 203, 243, 0.1))'
              : 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(33, 203, 243, 0.1))',
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <StatsIcon color="primary" />
            <Typography variant="h6">Site Statistics</Typography>
          </Stack>
          <IconButton
            onClick={() => setStatusDialogOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
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
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                  <Typography variant="body2" color="text.secondary">
                    Last checked: {selectedSiteStatus.lastChecked ? 
                      new Date(selectedSiteStatus.lastChecked).toLocaleString() : 
                      'Never'}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  24-Hour Uptime
                </Typography>
                <Stack spacing={2.5}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SignalIcon color="success" fontSize="small" />
                        <Typography variant="body2">Overall</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight="medium">
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.overall)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.overall}
                      color="success"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <NetworkIcon color="info" fontSize="small" />
                        <Typography variant="body2">HTTP</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight="medium">
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.http)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.http}
                      color="info"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ServerIcon color="primary" fontSize="small" />
                        <Typography variant="body2">Ping</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight="medium">
                        {formatUptime(selectedSiteStatus.uptime.last24Hours.ping)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedSiteStatus.uptime.last24Hours.ping}
                      color="primary"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              </Box>

              {selectedSiteStatus.ssl && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                      SSL Certificate
                    </Typography>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SecurityIcon color="success" fontSize="small" />
                        <Typography variant="body2">
                          Valid until {new Date(selectedSiteStatus.ssl.validTo).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                          Issuer:
                        </Box>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {selectedSiteStatus.ssl.issuer}
                        </Typography>
                      </Stack>
                      <Chip
                        icon={<SecurityIcon />}
                        label={`${selectedSiteStatus.ssl.daysUntilExpiry} days until expiry`}
                        color={selectedSiteStatus.ssl.daysUntilExpiry > 30 ? "success" : "warning"}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Box>
                </>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UpdateIcon fontSize="small" />
                Based on {selectedSiteStatus.uptime.last24Hours.totalChecks} checks in the last 24 hours
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              No status information available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => setStatusDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)'
                  : 'linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 