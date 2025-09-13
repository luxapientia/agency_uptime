import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
  Lock as LockIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import type { Site, CreateSiteData } from '../../types/site.types';
import type { RootState } from '../../store';
import { getMinCheckIntervalAllowed } from '../../utils/featureUtils';

interface SiteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSiteData) => void;
  site?: Site | null;
  isLoading?: boolean;
}

const INTERVAL_OPTIONS = [0.5, 1, 5];

export default function SiteForm({ open, onClose, onSubmit, site, isLoading }: SiteFormProps) {
  const theme = useTheme();
  const { userMemberships } = useSelector((state: RootState) => state.membership);
  
  const getNowUtcDay = () => String(new Date().getUTCDate());
  const getNowUtcTime = () => {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Calculate available check intervals based on user's membership features
  const availableIntervals = useMemo(() => {
    const now = new Date();
    const activeMemberships = userMemberships.filter(membership => 
      new Date(membership.endDate) > now
    );
    
    // Get all features from active memberships
    const userFeatures = activeMemberships.flatMap(membership => 
      membership.membershipPlan.features.map(feature => ({
        featureKey: feature,
        endDate: new Date(membership.endDate)
      }))
    );
    
    const minIntervalSeconds = getMinCheckIntervalAllowed(userFeatures);
    
    // Filter intervals based on user's membership
    return INTERVAL_OPTIONS.filter(interval => {
      const intervalSeconds = interval * 60; // Convert minutes to seconds
      return intervalSeconds >= minIntervalSeconds;
    });
  }, [userMemberships]);

  // Get the minimum allowed interval for display
  const minAllowedInterval = useMemo(() => {
    const now = new Date();
    const activeMemberships = userMemberships.filter(membership => 
      new Date(membership.endDate) > now
    );
    
    const userFeatures = activeMemberships.flatMap(membership => 
      membership.membershipPlan.features.map(feature => ({
        featureKey: feature,
        endDate: new Date(membership.endDate)
      }))
    );
    
    return getMinCheckIntervalAllowed(userFeatures);
  }, [userMemberships]);
  const [formData, setFormData] = useState<Partial<Site & { monthlyReportDay?: string; monthlyReportTime?: string }>>({
    name: '',
    url: '',
    checkInterval: 1,
    isActive: true,
    monthlyReport: false,
    monthlyReportDay: getNowUtcDay(),
    monthlyReportTime: getNowUtcTime(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (site) {
      // Check if the site's current interval is still allowed
      const siteIntervalSeconds = site.checkInterval * 60;
      const isIntervalAllowed = siteIntervalSeconds >= minAllowedInterval;
      
      setFormData({
        name: site.name,
        url: site.url,
        checkInterval: isIntervalAllowed ? site.checkInterval : availableIntervals[0] || 5,
        isActive: site.isActive,
        monthlyReport: site.monthlyReport,
        monthlyReportDay: getNowUtcDay(),
        monthlyReportTime: getNowUtcTime(),
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: availableIntervals[0] || 5,
        isActive: true,
        monthlyReport: false,
        monthlyReportDay: getNowUtcDay(),
        monthlyReportTime: getNowUtcTime(),
      });
    }
    setErrors({});
  }, [site, availableIntervals, minAllowedInterval]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!formData.url?.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    if (formData.monthlyReport) {
      if (!formData.monthlyReportDay) {
        newErrors.monthlyReportDay = 'Select the day of month.';
      }
      if (!formData.monthlyReportTime) {
        newErrors.monthlyReportTime = 'Select the time (UTC).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      let monthlyReportSendAt: string | undefined;
      if (formData.monthlyReport) {
        const now = new Date();
        const year = now.getUTCFullYear();
        const monthIndex = now.getUTCMonth(); // 0-based
        const dayInt = Math.max(1, Math.min(31, parseInt(formData.monthlyReportDay || '1', 10)));
        const [hhStr = '00', mmStr = '00'] = (formData.monthlyReportTime || '00:00').split(':');
        const hh = Math.max(0, Math.min(23, parseInt(hhStr, 10)));
        const mm = Math.max(0, Math.min(59, parseInt(mmStr, 10)));
        // Clamp day to last day of current month
        const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
        const day = Math.min(dayInt, lastDay);
        const dt = new Date(Date.UTC(year, monthIndex, day, hh, mm, 0));
        monthlyReportSendAt = dt.toISOString();
      }

      const payload: CreateSiteData = {
        name: formData.name || '',
        url: formData.url || '',
        checkInterval: (formData.checkInterval as number) || 1,
        monthlyReport: !!formData.monthlyReport,
        monthlyReportSendAt,
      };
      onSubmit(payload);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px', // 2 * default borderRadius (8px)
          overflow: 'hidden',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
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
            <LanguageIcon sx={{ color: theme.palette.primary.main }} />
            {site ? 'Edit Site' : 'Add New Site'}
          </Typography>
          <IconButton
            onClick={onClose}
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
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ color: theme.palette.action.active }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px', // 1.5 * default borderRadius (8px)
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />

            <TextField
              label="Site URL"
              fullWidth
              value={formData.url}
              onChange={(e) => {
                setFormData({ ...formData, url: e.target.value });
                if (errors.url) {
                  setErrors({ ...errors, url: '' });
                }
              }}
              error={!!errors.url}
              helperText={errors.url}
              placeholder="https://example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LanguageIcon sx={{ color: theme.palette.action.active }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />

            <FormControl fullWidth>
              <Select
                labelId="check-interval-label"
                value={formData.checkInterval}
                onChange={(e) => setFormData({ ...formData, checkInterval: e.target.value as number })}
                startAdornment={
                  <InputAdornment position="start">
                    <ScheduleIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '12px',
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              >
                {INTERVAL_OPTIONS.map((interval) => {
                  const isAvailable = availableIntervals.includes(interval);
                  const isRestricted = !isAvailable;
                  
                  return (
                    <MenuItem 
                      key={interval} 
                      value={interval}
                      disabled={isRestricted}
                      sx={{
                        opacity: isRestricted ? 0.6 : 1,
                        '&.Mui-disabled': {
                          color: theme.palette.text.disabled,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ flex: 1 }}>
                          {interval === 0.5 ? 'Every 30 seconds' : `Every ${interval} minute${interval > 1 ? 's' : ''}`}
                        </Box>
                        {isRestricted && (
                          <Chip
                            icon={<LockIcon />}
                            label="Upgrade Required"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem',
                              height: '20px',
                              '& .MuiChip-icon': {
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                  <Typography variant="body2" component="span">
                    Choose how often the site should be checked
                  </Typography>
                  {minAllowedInterval < 300 && (
                    <Chip
                      icon={<UpgradeIcon />}
                      label={`Min: ${minAllowedInterval === 30 ? '30s' : minAllowedInterval === 60 ? '1m' : '5m'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.75rem',
                        height: '20px',
                        '& .MuiChip-icon': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  )}
                </Box>
              </FormHelperText>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.monthlyReport || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      monthlyReport: checked,
                      monthlyReportDay: checked && !prev.monthlyReportDay ? getNowUtcDay() : prev.monthlyReportDay,
                      monthlyReportTime: checked && !prev.monthlyReportTime ? getNowUtcTime() : prev.monthlyReportTime,
                    }));
                  }}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="body2">
                    Include in Monthly Reports
                  </Typography>
                </Box>
              }
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

            {formData.monthlyReport && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <Select
                    value={formData.monthlyReportDay || ''}
                    displayEmpty
                    onChange={(e) => setFormData({ ...formData, monthlyReportDay: e.target.value as string })}
                    startAdornment={
                      <InputAdornment position="start">
                        <CalendarMonthIcon sx={{ color: theme.palette.action.active, ml: 1 }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Day of month
                    </MenuItem>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <MenuItem key={d} value={String(d)}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText error={!!errors.monthlyReportDay}>
                    {errors.monthlyReportDay || 'Choose the day of the month'}
                  </FormHelperText>
                </FormControl>

                <TextField
                  label="Time (UTC)"
                  type="time"
                  fullWidth
                  value={formData.monthlyReportTime || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyReportTime: e.target.value })}
                  error={!!errors.monthlyReportTime}
                  helperText={errors.monthlyReportTime || 'HH:MM in 24-hour format'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon sx={{ color: theme.palette.action.active }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                  inputProps={{ step: 60 }}
                />
              </Box>
            )}

            <Alert
              severity="info"
              sx={{
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.info.main, 0.08),
                '& .MuiAlert-icon': {
                  color: theme.palette.info.main,
                },
              }}
            >
              The site will be monitored from multiple locations to ensure accurate uptime tracking.
            </Alert>

            {/* Check Interval Limitation Alert */}
            {availableIntervals.length < INTERVAL_OPTIONS.length && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.warning.main, 0.08),
                  '& .MuiAlert-icon': {
                    color: theme.palette.warning.main,
                  },
                }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => window.open('/membership-plans', '_blank')}
                    sx={{ 
                      fontWeight: 'bold',
                      textTransform: 'none'
                    }}
                  >
                    Upgrade Plan
                  </Button>
                }
              >
                <Typography variant="body2">
                  Your current plan allows check intervals of {minAllowedInterval === 30 ? '30 seconds or longer' : minAllowedInterval === 60 ? '1 minute or longer' : '5 minutes or longer'}. 
                  Upgrade your plan to use faster check intervals for more responsive monitoring.
                </Typography>
              </Alert>
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
            onClick={onClose}
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
            type="submit"
            variant="contained"
            disabled={isLoading}
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
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : site ? (
              'Save Changes'
            ) : (
              'Add Site'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 