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
  CircularProgress,
  FormHelperText,
  Alert,
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
      setFormData({
        name: site.name,
        url: site.url,
        checkInterval: site.checkInterval,
        isActive: site.isActive,
        monthlyReport: site.monthlyReport,
        monthlyReportDay: getNowUtcDay(),
        monthlyReportTime: getNowUtcTime(),
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: 1,
        isActive: true,
        monthlyReport: false,
        monthlyReportDay: getNowUtcDay(),
        monthlyReportTime: getNowUtcTime(),
      });
    }
    setErrors({});
  }, [site]);

  // Update checkInterval if current one is not allowed based on membership
  useEffect(() => {
    if (availableIntervals.length > 0 && formData.checkInterval) {
      const currentIntervalSeconds = formData.checkInterval * 60;
      if (currentIntervalSeconds < minAllowedInterval) {
        // Set to the first available interval (which should be the minimum allowed)
        const firstAvailableInterval = availableIntervals[0];
        setFormData(prev => ({
          ...prev,
          checkInterval: firstAvailableInterval
        }));
      }
    }
  }, [availableIntervals, minAllowedInterval, formData.checkInterval]);

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
          borderRadius: '24px',
          overflow: 'hidden',
          border: '2px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 60px rgba(59, 130, 246, 0.15)',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
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
              <LanguageIcon />
            </Box>
            {site ? 'Edit Site' : 'Add New Site'}
          </Typography>
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

        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
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
                    <Box sx={{
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3B82F6',
                      ml: 1,
                    }}>
                      <LinkIcon fontSize="small" />
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  border: '2px solid rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B82F6',
                      borderWidth: '2px',
                    },
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#64748B',
                  fontWeight: 600,
                },
                '& .MuiFormHelperText-root': {
                  color: '#EF4444',
                  fontWeight: 500,
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
                    <Box sx={{
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      color: '#8B5CF6',
                      ml: 1,
                    }}>
                      <LanguageIcon fontSize="small" />
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  border: '2px solid rgba(139, 92, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                      borderWidth: '2px',
                    },
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.15)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#64748B',
                  fontWeight: 600,
                },
                '& .MuiFormHelperText-root': {
                  color: '#EF4444',
                  fontWeight: 500,
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
                    <Box sx={{
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      ml: 1,
                    }}>
                      <ScheduleIcon fontSize="small" />
                    </Box>
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '16px',
                  border: '2px solid rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                      borderWidth: '2px',
                    },
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isRestricted ? 0.5 : 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isRestricted && <LockIcon fontSize="small" color="disabled" />}
                        <span>
                          {interval === 0.5 ? 'Every 30 seconds' : `Every ${interval} minute${interval > 1 ? 's' : ''}`}
                        </span>
                      </Box>
                      {isRestricted && (
                        <Chip
                          label="Upgrade Required"
                          size="small"
                          color="warning"
                          variant="outlined"
                          icon={<UpgradeIcon />}
                        />
                      )}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#3B82F6',
                fontWeight: 500,
                mt: 1,
              }}>
                <InfoIcon fontSize="small" />
                Choose how often the site should be checked
                {minAllowedInterval > 30 && (
                  <Chip
                    label={`Minimum: ${minAllowedInterval === 60 ? '1 minute' : minAllowedInterval === 300 ? '5 minutes' : `${minAllowedInterval}s`}`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
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
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3B82F6',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#3B82F6',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                  }}>
                    <AssessmentIcon />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    Include in Monthly Reports
                  </Typography>
                </Box>
              }
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '16px',
                p: 3,
                m: 0,
                width: '100%',
                justifyContent: 'space-between',
                border: '2px solid rgba(59, 130, 246, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                },
                '& .MuiFormControlLabel-label': {
                  flex: 1,
                },
              }}
            />

            {formData.monthlyReport && (
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <Select
                    value={formData.monthlyReportDay || ''}
                    displayEmpty
                    onChange={(e) => setFormData({ ...formData, monthlyReportDay: e.target.value as string })}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box sx={{
                          p: 1,
                          borderRadius: '8px',
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          color: '#F59E0B',
                          ml: 1,
                        }}>
                          <CalendarMonthIcon fontSize="small" />
                        </Box>
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: '16px',
                      border: '2px solid rgba(245, 158, 11, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#F59E0B',
                          borderWidth: '2px',
                        },
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.15)',
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
                  <FormHelperText error={!!errors.monthlyReportDay} sx={{ color: '#EF4444', fontWeight: 500, mt: 1 }}>
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
                        <Box sx={{
                          p: 1,
                          borderRadius: '8px',
                          bgcolor: 'rgba(6, 182, 212, 0.1)',
                          color: '#06B6D4',
                          ml: 1,
                        }}>
                          <AccessTimeIcon fontSize="small" />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      border: '2px solid rgba(6, 182, 212, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.1)',
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#06B6D4',
                          borderWidth: '2px',
                        },
                        boxShadow: '0 6px 20px rgba(6, 182, 212, 0.15)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#64748B',
                      fontWeight: 600,
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#EF4444',
                      fontWeight: 500,
                    },
                  }}
                  inputProps={{ step: 60 }}
                />
              </Box>
            )}

            {/* Check Interval Limitation Warning */}
            {minAllowedInterval > 30 && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '2px solid rgba(245, 158, 11, 0.15)',
                  '& .MuiAlert-icon': {
                    color: '#F59E0B',
                  },
                  '& .MuiAlert-message': {
                    color: '#1E293B',
                    fontWeight: 500,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LockIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Check Interval Limitations
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Your current membership plan allows a minimum check interval of{' '}
                  {minAllowedInterval === 60 ? '1 minute' : minAllowedInterval === 300 ? '5 minutes' : `${minAllowedInterval} seconds`}.
                  Faster intervals require a higher-tier membership plan.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UpgradeIcon />}
                  sx={{
                    color: '#F59E0B',
                    borderColor: '#F59E0B',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: '#F59E0B',
                    },
                  }}
                  onClick={() => window.open('/membership-plans', '_blank')}
                >
                  Upgrade Plan
                </Button>
              </Alert>
            )}

            <Alert
              severity="info"
              sx={{
                borderRadius: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '2px solid rgba(59, 130, 246, 0.15)',
                '& .MuiAlert-icon': {
                  color: '#3B82F6',
                },
                '& .MuiAlert-message': {
                  color: '#1E293B',
                  fontWeight: 500,
                },
              }}
            >
              The site will be monitored from multiple locations to ensure accurate uptime tracking.
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 4,
            py: 3,
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
            borderTop: '2px solid rgba(59, 130, 246, 0.1)',
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '16px',
              px: 4,
              py: 1.5,
              color: '#64748B',
              border: '2px solid rgba(100, 116, 139, 0.2)',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(100, 116, 139, 0.05)',
                borderColor: '#64748B',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.15)',
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
              '&:disabled': {
                background: 'rgba(156, 163, 175, 0.5)',
                boxShadow: 'none',
                transform: 'none',
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