import { useState } from 'react';
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
  Stack,
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
  SpeedOutlined as SpeedIcon,
  CloseOutlined as CloseIcon,
  PictureAsPdf as PdfIcon,
  NotificationsOutlined as NotificationIcon,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../store';
import {
  createSite,
  updateSite,
  deleteSite,
  setSelectedSite,
} from '../store/slices/siteSlice';
import type { Site, CreateSiteData, UpdateSiteData } from '../types/site.types';
import SiteForm from '../components/sites/SiteForm';
import NotificationSettings from '../components/sites/NotificationSettings';
import SiteStatistics from '../components/sites/SiteStatistics';
import axios from '../lib/axios';
import { showToast } from '../utils/toast';
import { alpha } from '@mui/material/styles';

export default function Sites() {
  const dispatch = useDispatch<AppDispatch>();
  const { sites, isLoading, selectedSite } = useSelector((state: RootState) => state.sites);
  const siteStatuses = useSelector((state: RootState) => state.siteStatus.statuses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedSiteForNotification, setSelectedSiteForNotification] = useState<Site | null>(null);

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
    setSelectedSiteId(site.id);
    setStatusDialogOpen(true);
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
                    <Tooltip title="Site Status">
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        {siteStatuses[site.id]?.isUp ? (
                          <>
                            <Box sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: 'success.main' 
                            }} />
                            <Typography color="success.main">Up</Typography>
                          </>
                        ) : (
                          <>
                            <Box sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: 'error.main' 
                            }} />
                            <Typography color="error.main">Down</Typography>
                          </>
                        )}
                      </Box>
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

      <SiteStatistics
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        siteId={selectedSiteId || ''}
      />

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