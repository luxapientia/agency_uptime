import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  CircularProgress,
  FormHelperText,
  Alert,
  alpha,
  FormControlLabel,
  Switch,
  TextField,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface MonitoredSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  checkInterval: number;
  monthlyReport: boolean;
}

interface UserSitesModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  loading?: boolean;
}

export default function UserSitesModal({ 
  open, 
  onClose, 
  userId, 
  loading = false 
}: UserSitesModalProps) {
  const theme = useTheme();
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [sitesLoading, setSitesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Site management states
  const [addSiteModalOpen, setAddSiteModalOpen] = useState(false);
  const [editSiteModalOpen, setEditSiteModalOpen] = useState(false);
  const [deleteSiteModalOpen, setDeleteSiteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<MonitoredSite | null>(null);
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    url: '',
    checkInterval: 1,
    monthlyReport: false,
    monthlyReportDay: '1',
    monthlyReportTime: '00:00',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Map sites to include checkInterval and monthlyReport with default values if not present
        const sitesWithInterval = response.data.sites.map((site: any) => ({
          ...site,
          checkInterval: site.checkInterval || 1, // Default to 1 minute if not specified
          monthlyReport: site.monthlyReport || false // Default to false if not specified
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

  // Site management functions
  const handleAddSite = () => {
    setSiteFormData({
      name: '',
      url: '',
      checkInterval: 1,
      monthlyReport: false,
      monthlyReportDay: '1',
      monthlyReportTime: '00:00',
    });
    setFormErrors({});
    setAddSiteModalOpen(true);
  };

  const handleEditSite = (site: MonitoredSite) => {
    setSelectedSite(site);
    setSiteFormData({
      name: site.name,
      url: site.url,
      checkInterval: site.checkInterval,
      monthlyReport: site.monthlyReport,
      monthlyReportDay: '1',
      monthlyReportTime: '00:00',
    });
    setFormErrors({});
    setEditSiteModalOpen(true);
  };

  const handleDeleteSite = (site: MonitoredSite) => {
    setSelectedSite(site);
    setDeleteSiteModalOpen(true);
  };

  const validateSiteForm = () => {
    const newErrors: Record<string, string> = {};

    if (!siteFormData.name?.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!siteFormData.url?.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(siteFormData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    if (siteFormData.monthlyReport) {
      if (!siteFormData.monthlyReportDay) {
        newErrors.monthlyReportDay = 'Select the day of month.';
      }
      if (!siteFormData.monthlyReportTime) {
        newErrors.monthlyReportTime = 'Select the time (UTC).';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitSite = async () => {
    if (!validateSiteForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Import adminService dynamically to avoid circular dependency
      const { default: adminService } = await import('../../services/admin.service');
      
      if (editSiteModalOpen && selectedSite) {
        // Update existing site
        await adminService.updateSite(selectedSite.id, {
          name: siteFormData.name,
          url: siteFormData.url,
          checkInterval: siteFormData.checkInterval,
          monthlyReport: siteFormData.monthlyReport,
          monthlyReportSendAt: siteFormData.monthlyReport ? 
            new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), parseInt(siteFormData.monthlyReportDay), 
              parseInt(siteFormData.monthlyReportTime.split(':')[0]), 
              parseInt(siteFormData.monthlyReportTime.split(':')[1]))).toISOString() : 
            undefined,
        });
      } else {
        // Create new site
        await adminService.createSite({
          userId: userId!,
          name: siteFormData.name,
          url: siteFormData.url,
          checkInterval: siteFormData.checkInterval,
          monthlyReport: siteFormData.monthlyReport,
          monthlyReportSendAt: siteFormData.monthlyReport ? 
            new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), parseInt(siteFormData.monthlyReportDay), 
              parseInt(siteFormData.monthlyReportTime.split(':')[0]), 
              parseInt(siteFormData.monthlyReportTime.split(':')[1]))).toISOString() : 
            undefined,
        });
      }
      
      // Close modal and refresh sites
      setAddSiteModalOpen(false);
      setEditSiteModalOpen(false);
      await fetchUserSites();
    } catch (error) {
      console.error('Error submitting site:', error);
      // TODO: Add proper error handling/toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSite) return;
    
    try {
      setIsSubmitting(true);
      
      // Import adminService dynamically to avoid circular dependency
      const { default: adminService } = await import('../../services/admin.service');
      
      await adminService.deleteSite(selectedSite.id);
      
      // Close modal and refresh sites
      setDeleteSiteModalOpen(false);
      await fetchUserSites();
    } catch (error) {
      console.error('Error deleting site:', error);
      // TODO: Add proper error handling/toast notification
    } finally {
      setIsSubmitting(false);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSite}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Add Site
          </Button>
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
        </Box>
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
                  <TableCell align="center" sx={{ width: '120px' }}>Monthly Reports</TableCell>
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
                      <Chip
                        icon={<AssessmentIcon fontSize="small" />}
                        label={site.monthlyReport ? 'Enabled' : 'Disabled'}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: site.monthlyReport ? theme.palette.success.main : theme.palette.grey[500],
                          borderColor: alpha(site.monthlyReport ? theme.palette.success.main : theme.palette.grey[500], 0.3),
                          backgroundColor: alpha(site.monthlyReport ? theme.palette.success.main : theme.palette.grey[500], 0.08),
                          fontSize: '0.75rem',
                          height: '24px',
                          borderRadius: '12px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit site">
                          <IconButton
                            size="small"
                            onClick={() => handleEditSite(site)}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete site">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSite(site)}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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

      {/* Add Site Modal */}
      <Dialog
        open={addSiteModalOpen}
        onClose={() => setAddSiteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon sx={{ color: theme.palette.primary.main }} />
            Add New Site
          </Typography>
          <IconButton
            onClick={() => setAddSiteModalOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label="Site Name"
              fullWidth
              value={siteFormData.name}
              onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <TextField
              label="Site URL"
              fullWidth
              value={siteFormData.url}
              onChange={(e) => setSiteFormData({ ...siteFormData, url: e.target.value })}
              error={!!formErrors.url}
              helperText={formErrors.url}
              placeholder="https://example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <FormControl fullWidth>
              <Select
                value={siteFormData.checkInterval}
                onChange={(e) => setSiteFormData({ ...siteFormData, checkInterval: e.target.value as number })}
                startAdornment={
                  <InputAdornment position="start">
                    <ScheduleIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '12px',
                }}
              >
                {[0.5, 1, 5].map((interval) => (
                  <MenuItem key={interval} value={interval}>
                    {interval === 0.5 ? 'Every 30 seconds' : `Every ${interval} minute${interval > 1 ? 's' : ''}`}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                Choose how often the site should be checked
              </FormHelperText>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={siteFormData.monthlyReport}
                  onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReport: e.target.checked })}
                  color="primary"
                />
              }
              label="Include in Monthly Reports"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: '12px',
                p: 2,
                m: 0,
                width: '100%',
                justifyContent: 'space-between',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '& .MuiFormControlLabel-label': {
                  flex: 1,
                },
              }}
            />

            {siteFormData.monthlyReport && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <Select
                    value={siteFormData.monthlyReportDay}
                    onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReportDay: e.target.value })}
                    startAdornment={
                      <InputAdornment position="start">
                        <CalendarMonthIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: '12px',
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <MenuItem key={d} value={String(d)}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Choose the day of the month</FormHelperText>
                </FormControl>

                <TextField
                  label="Time (UTC)"
                  type="time"
                  fullWidth
                  value={siteFormData.monthlyReportTime}
                  onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReportTime: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                  inputProps={{ step: 60 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.02),
          }}
        >
          <Button
            onClick={() => setAddSiteModalOpen(false)}
            sx={{
              borderRadius: '12px',
              px: 3,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitSite}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              borderRadius: '12px',
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Add Site'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Site Modal */}
      <Dialog
        open={editSiteModalOpen}
        onClose={() => setEditSiteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon sx={{ color: theme.palette.primary.main }} />
            Edit Site
          </Typography>
          <IconButton
            onClick={() => setEditSiteModalOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label="Site Name"
              fullWidth
              value={siteFormData.name}
              onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <TextField
              label="Site URL"
              fullWidth
              value={siteFormData.url}
              onChange={(e) => setSiteFormData({ ...siteFormData, url: e.target.value })}
              error={!!formErrors.url}
              helperText={formErrors.url}
              placeholder="https://example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <FormControl fullWidth>
              <Select
                value={siteFormData.checkInterval}
                onChange={(e) => setSiteFormData({ ...siteFormData, checkInterval: e.target.value as number })}
                startAdornment={
                  <InputAdornment position="start">
                    <ScheduleIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '12px',
                }}
              >
                {[0.5, 1, 5].map((interval) => (
                  <MenuItem key={interval} value={interval}>
                    {interval === 0.5 ? 'Every 30 seconds' : `Every ${interval} minute${interval > 1 ? 's' : ''}`}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                Choose how often the site should be checked
              </FormHelperText>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={siteFormData.monthlyReport}
                  onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReport: e.target.checked })}
                  color="primary"
                />
              }
              label="Include in Monthly Reports"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: '12px',
                p: 2,
                m: 0,
                width: '100%',
                justifyContent: 'space-between',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '& .MuiFormControlLabel-label': {
                  flex: 1,
                },
              }}
            />

            {siteFormData.monthlyReport && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <Select
                    value={siteFormData.monthlyReportDay}
                    onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReportDay: e.target.value })}
                    startAdornment={
                      <InputAdornment position="start">
                        <CalendarMonthIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: '12px',
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <MenuItem key={d} value={String(d)}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Choose the day of the month</FormHelperText>
                </FormControl>

                <TextField
                  label="Time (UTC)"
                  type="time"
                  fullWidth
                  value={siteFormData.monthlyReportTime}
                  onChange={(e) => setSiteFormData({ ...siteFormData, monthlyReportTime: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                  inputProps={{ step: 60 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.02),
          }}
        >
          <Button
            onClick={() => setEditSiteModalOpen(false)}
            sx={{
              borderRadius: '12px',
              px: 3,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitSite}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              borderRadius: '12px',
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Site Confirmation Modal */}
      <Dialog
        open={deleteSiteModalOpen}
        onClose={() => setDeleteSiteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.error.main, 0.1)
              : alpha(theme.palette.error.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.error.main }}>
            <DeleteIcon sx={{ color: theme.palette.error.main }} />
            Delete Site
          </Typography>
          <IconButton
            onClick={() => setDeleteSiteModalOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Are you sure you want to delete the site <strong>"{selectedSite?.name}"</strong>?
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. The site will be permanently removed from monitoring.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.02),
          }}
        >
          <Button
            onClick={() => setDeleteSiteModalOpen(false)}
            sx={{
              borderRadius: '12px',
              px: 3,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isSubmitting}
            sx={{
              borderRadius: '12px',
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.light} 90%)`,
              boxShadow: `0 3px 5px 2px ${alpha(theme.palette.error.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.error.light} 30%, ${theme.palette.error.main} 90%)`,
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Delete Site'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 