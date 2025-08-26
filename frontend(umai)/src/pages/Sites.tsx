import { useState, useMemo } from 'react';
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
  Tooltip,
  Link,
  useTheme,
  useMediaQuery,
  TablePagination,
  Stack,
  Divider,
  Avatar,
  Tabs,
  Tab,
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
  HttpsOutlined as HttpsIcon,
  SignalWifiStatusbar4Bar as OnlineIcon,
  Visibility as VisibilityIcon,
  // ContentCopy as CopyIcon,
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
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

export default function Sites() {
  const dispatch = useDispatch<AppDispatch>();
  const { sites, isLoading, selectedSite } = useSelector((state: RootState) => state.sites);
  const siteStatuses = useSelector((state: RootState) => state.siteStatus.statuses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  // Get current filter from URL path
  const currentPath = location.pathname.split('/').pop() || '';
  const currentFilter = ['online', 'ssl-protected', 'with-notifications'].includes(currentPath)
    ? currentPath
    : '';

  // Filter sites based on current path
  const filteredSites = useMemo(() => {
    if (!currentFilter) return sites;

    return sites.filter(site => {
      switch (currentFilter) {
        case 'online':
          return siteStatuses[site.id]?.isUp;
        case 'ssl-protected':
          return site.url.startsWith('https://');
        case 'with-notifications':
          return site.notificationSettings && site.notificationSettings.length > 0;
        default:
          return true;
      }
    });
  }, [sites, currentFilter, siteStatuses]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedSiteForNotification, setSelectedSiteForNotification] = useState<Site | null>(null);
  const [downloadingPdfSiteId, setDownloadingPdfSiteId] = useState<string | null>(null);

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
      showToast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleNotificationClick = (site: Site) => {
    setSelectedSiteForNotification(site);
    setNotificationDialogOpen(true);
  };

  const handleDownloadSitePdf = async (site: Site) => {
    try {
      setDownloadingPdfSiteId(site.id);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.get(`/reports/pdf?siteId=${site.id}&tz=${encodeURIComponent(tz)}`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${site.name}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success(`${site.name} report downloaded successfully`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast.error(`Failed to download ${site.name} report. Please try again.`);
    } finally {
      setDownloadingPdfSiteId(null);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setPage(0); // Reset pagination when changing filters
    if (newValue === '') {
      navigate('/sites');
    } else {
      navigate(`/sites/${newValue}`);
    }
  };

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    return {
      online: sites.filter(site => siteStatuses[site.id]?.isUp).length,
      sslProtected: sites.filter(site => site.url.startsWith('https://')).length,
      withNotifications: sites.filter(site => site.notificationSettings && site.notificationSettings.length > 0).length
    };
  }, [sites, siteStatuses]);

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
        mb: 5,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 3,
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        p: 4,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        borderRadius: '24px',
        border: '2px solid rgba(59, 130, 246, 0.1)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100%',
          background: 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.05))',
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
        },
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" component="h1" sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1E293B 0%, #3B82F6 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            lineHeight: 1.2,
            mb: 1,
          }}>
            Monitored Sites
          </Typography>
          <Typography variant="h6" sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '1.125rem',
          }}>
            Track and manage your website performance
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={isGeneratingReport ? <CircularProgress size={20} /> : <PdfIcon />}
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            fullWidth={isMobile}
            sx={{
              borderRadius: '16px',
              py: 2,
              px: 3,
              borderColor: '#3B82F6',
              color: '#3B82F6',
              borderWidth: '2px',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                borderColor: '#1D4ED8',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              borderRadius: '16px',
              py: 2,
              px: 3,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Add New Site
          </Button>
        </Stack>
      </Box>

      <Box sx={{
        mb: 4,
        borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
        background: 'rgba(248, 250, 252, 0.5)',
        borderRadius: '16px 16px 0 0',
        p: 2,
      }}>
        <Tabs
          value={currentFilter || ''}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#64748B',
              borderRadius: '12px 12px 0 0',
              mx: 0.5,
              '&.Mui-selected': {
                color: '#3B82F6',
                fontWeight: 700,
              },
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                color: '#3B82F6',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3B82F6',
              height: '3px',
              borderRadius: '2px',
            },
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                }}>
                  <LanguageIcon fontSize="small" />
                </Box>
                <span>All Sites ({sites.length})</span>
              </Stack>
            }
            value=""
          />
          <Tab
            label={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                }}>
                  <OnlineIcon fontSize="small" />
                </Box>
                <span>Online Sites ({filterCounts.online})</span>
              </Stack>
            }
            value="online"
          />
          <Tab
            label={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                  color: '#8B5CF6',
                }}>
                  <HttpsIcon fontSize="small" />
                </Box>
                <span>SSL Protected ({filterCounts.sslProtected})</span>
              </Stack>
            }
            value="ssl-protected"
          />
          <Tab
            label={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: '#F59E0B',
                }}>
                  <NotificationIcon fontSize="small" />
                </Box>
                <span>With Notifications ({filterCounts.withNotifications})</span>
              </Stack>
            }
            value="with-notifications"
          />
        </Tabs>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          maxWidth: '100%',
          border: '2px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 10px 40px rgba(59, 130, 246, 0.1)',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          '& .MuiTableCell-root': {
            borderColor: 'rgba(59, 130, 246, 0.1)',
            whiteSpace: 'nowrap',
            padding: '16px 12px',
          }
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
              '& .MuiTableCell-root': {
                borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                fontWeight: 700,
                color: '#1E293B',
                fontSize: '0.95rem',
                textAlign: 'center',
                py: 2,
              }
            }}>
              <TableCell>Status</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Check Interval</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>View Details</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? filteredSites.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : filteredSites
            ).map((site) => (
              <TableRow
                key={site.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.03)',
                    cursor: 'pointer',
                    transform: 'scale(1.01)',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(59, 130, 246, 0.08)',
                  }
                }}
                onClick={() => navigate(`/sites/${site.id}`)}
              >
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                    <Tooltip title="Site Status">
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: siteStatuses[site.id]?.isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `2px solid ${siteStatuses[site.id]?.isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      }}>
                        {siteStatuses[site.id]?.isUp ? (
                          <>
                            <Box sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: '#10B981',
                              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                            }} />
                            <Typography color="#10B981" fontWeight={600} fontSize="0.875rem">Online</Typography>
                          </>
                        ) : (
                          <>
                            <Box sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: '#EF4444',
                              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                            }} />
                            <Typography color="#EF4444" fontWeight={600} fontSize="0.875rem">Offline</Typography>
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
                        width: 40,
                        height: 40,
                        bgcolor: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        border: '2px solid rgba(59, 130, 246, 0.2)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      {site.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{
                      fontWeight: 600,
                      color: '#1E293B',
                      fontSize: '1rem',
                    }}>
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
                      gap: 1.5,
                      color: '#3B82F6',
                      textDecoration: 'none',
                      maxWidth: '300px',
                      p: 1.5,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        textDecoration: 'none',
                        color: '#1D4ED8',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                      }
                    }}
                  >
                    <Box sx={{
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3B82F6',
                    }}>
                      <LanguageIcon fontSize="small" />
                    </Box>
                    <Typography
                      noWrap
                      sx={{
                        flex: 1,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        color: 'inherit',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                      }}
                    >
                      {site.url}
                    </Typography>
                  </Link>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    justifyContent: 'center',
                    color: '#64748B',
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                  }}>
                    <SpeedIcon fontSize="small" color="inherit" />
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      Every {site.checkInterval} minute{site.checkInterval > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    justifyContent: 'center',
                    color: '#64748B',
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(139, 92, 246, 0.05)',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                  }}>
                    <UpdateIcon fontSize="small" color="inherit" />
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {formatDate(site.updatedAt)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sites/${site.id}`);
                    }}
                    sx={{
                      borderRadius: '12px',
                      px: 3,
                      py: 1,
                      borderColor: '#3B82F6',
                      color: '#3B82F6',
                      borderWidth: '2px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: '#1D4ED8',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)',
                      }
                    }}
                  >
                    Advanced Report
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="View Statistics">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusClick(site);
                        }}
                        size="small"
                        sx={{
                          p: 1.5,
                          color: '#3B82F6',
                          bgcolor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                          }
                        }}
                      >
                        <StatsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF Report">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSitePdf(site);
                        }}
                        size="small"
                        disabled={downloadingPdfSiteId === site.id}
                        sx={{
                          p: 1.5,
                          color: '#10B981',
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(16, 185, 129, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)',
                          },
                          '&:disabled': {
                            color: '#9CA3AF',
                            bgcolor: 'rgba(156, 163, 175, 0.1)',
                            borderColor: 'rgba(156, 163, 175, 0.2)',
                          }
                        }}
                      >
                        {downloadingPdfSiteId === site.id ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <PdfIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Notification Settings">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(site);
                        }}
                        size="small"
                        sx={{
                          p: 1.5,
                          color: '#F59E0B',
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(245, 158, 11, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)',
                          }
                        }}
                      >
                        <NotificationIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Site">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(site);
                        }}
                        size="small"
                        sx={{
                          p: 1.5,
                          color: '#8B5CF6',
                          bgcolor: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(139, 92, 246, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.25)',
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Site">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(site);
                        }}
                        size="small"
                        sx={{
                          p: 1.5,
                          color: '#EF4444',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.25)',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title="Copy Site Detail Page URL">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/site-status/${site.id}`);
                          showToast.success('Site detail page url copied to clipboard');
                        }}
                        size="small"
                        sx={{
                          p: 1.5,
                          color: '#06B6D4',
                          bgcolor: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'rgba(6, 182, 212, 0.15)',
                            transform: 'translateY(-2px) scale(1.05)',
                            boxShadow: '0 6px 20px rgba(6, 182, 212, 0.25)',
                          }
                        }}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip> */}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSites.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '2px solid rgba(59, 130, 246, 0.1)',
            background: 'rgba(248, 250, 252, 0.5)',
            '.MuiTablePagination-select': {
              color: '#1E293B',
              fontWeight: 600,
            },
            '.MuiTablePagination-displayedRows': {
              color: '#64748B',
              fontWeight: 500,
            },
            '.MuiTablePagination-actions': {
              '.MuiIconButton-root': {
                color: '#3B82F6',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                },
                '&.Mui-disabled': {
                  color: '#9CA3AF',
                }
              }
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
            py: 3,
            px: 4,
          }}
        >
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              fontWeight: 700,
              color: '#1E293B',
            }}
          >
            <Box sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <NotificationIcon />
            </Box>
            Notification Settings
          </Typography>
          <IconButton
            onClick={() => {
              setNotificationDialogOpen(false);
              setSelectedSiteForNotification(null);
            }}
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