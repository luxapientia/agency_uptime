import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
  Alert,
  Divider,
  Chip,
  Avatar,
  Stack,
  useMediaQuery,
  Fade,
  Slide,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Monitor as MonitorIcon,
  Psychology as PsychologyIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  People as PeopleIcon,
  Api as ApiIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Email as EmailAlertIcon,
  Chat as ChatIcon,
  Webhook as WebhookIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import type { AdminUser, UpdateUserRequest } from '../../types/admin.types';
import type { UserRole } from '../../types/auth.types';
import { FEATURES, FEATURE_CATEGORIES } from '../../constants/features.constants';
import { getFeatureDescription, isValidFeatureKey } from '../../utils/featureUtils';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSave: (userId: string, data: UpdateUserRequest) => Promise<void>;
  loading?: boolean;
}

const roleConfig = {
  USER: { color: 'default' as const, icon: <PersonIcon fontSize="small" />, description: 'Standard user with basic access' },
  ADMIN: { color: 'warning' as const, icon: <SecurityIcon fontSize="small" />, description: 'Administrator with elevated privileges' },
  SUPER_ADMIN: { color: 'error' as const, icon: <SecurityIcon fontSize="small" />, description: 'Super administrator with full system access' },
} as const;

// Feature category icons mapping
const categoryIcons = {
  MONITORING: <MonitorIcon fontSize="small" />,
  INTELLIGENCE: <PsychologyIcon fontSize="small" />,
  NOTIFICATIONS: <NotificationsIcon fontSize="small" />,
  BRANDING: <PaletteIcon fontSize="small" />,
  MANAGEMENT: <PeopleIcon fontSize="small" />,
  INTEGRATION: <ApiIcon fontSize="small" />,
} as const;

export default function EditUserModal({ 
  open, 
  onClose, 
  user, 
  onSave, 
  loading = false 
}: EditUserModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    role: 'USER' as UserRole,
  });
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    role: 'USER' as UserRole,
  });
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [originalFeatures, setOriginalFeatures] = useState<Set<string>>(new Set());
  const [featureEndDates, setFeatureEndDates] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string>('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
      };
      setFormData(userData);
      setOriginalData(userData);
      
      // Initialize feature selections
      const currentFeatures = new Set(user.userFeatures?.map(f => f.featureKey) || []);
      setSelectedFeatures(currentFeatures);
      setOriginalFeatures(currentFeatures);
      
      // Initialize feature end dates
      const currentEndDates: Record<string, string> = {};
      user.userFeatures?.forEach(feature => {
        currentEndDates[feature.featureKey] = new Date(feature.endDate).toISOString().split('T')[0];
      });
      setFeatureEndDates(currentEndDates);
      
      setErrors({});
      setSaveError('');
      setTouched({});
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFeatureToggle = (featureKey: string) => {
    setSelectedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureKey)) {
        newSet.delete(featureKey);
        // Remove end date when feature is unchecked
        setFeatureEndDates(prev => {
          const newDates = { ...prev };
          delete newDates[featureKey];
          return newDates;
        });
      } else {
        newSet.add(featureKey);
        // Set default end date (30 days from now) when feature is checked
        const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFeatureEndDates(prev => ({
          ...prev,
          [featureKey]: defaultDate
        }));
      }
      return newSet;
    });
  };

  const handleFeatureEndDateChange = (featureKey: string, date: string) => {
    setFeatureEndDates(prev => ({
      ...prev,
      [featureKey]: date
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;

    try {
      setSaveError('');
      
      // Prepare user features data with custom end dates
      const userFeatures = Array.from(selectedFeatures).map(featureKey => ({
        featureKey,
        endDate: featureEndDates[featureKey] ? new Date(featureEndDates[featureKey]).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      // Save user information and features together
      await onSave(user.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName.trim(),
        role: formData.role,
        userFeatures,
      });

      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleCancel = () => {
    // Restore original values
    setFormData(originalData);
    setSelectedFeatures(originalFeatures);
    
    // Restore original feature end dates
    const originalEndDates: Record<string, string> = {};
    user?.userFeatures?.forEach(feature => {
      originalEndDates[feature.featureKey] = new Date(feature.endDate).toISOString().split('T')[0];
    });
    setFeatureEndDates(originalEndDates);
    
    setErrors({});
    setTouched({});
    setSaveError('');
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      handleCancel();
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  const isFieldValid = (field: string): boolean => {
    return touched[field] && !errors[field] && formData[field as keyof typeof formData].trim().length > 0;
  };

  // Helper function to get feature status
  const getFeatureStatus = (featureKey: string) => {
    if (!user?.userFeatures) return 'none';
    
    const userFeature = user.userFeatures.find(f => f.featureKey === featureKey);
    if (!userFeature) return 'none';
    
    const now = new Date();
    const endDate = new Date(userFeature.endDate);
    
    if (endDate <= now) return 'expired';
    
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    
    return 'active';
  };

  // Helper function to get feature status color
  const getFeatureStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expiring-soon': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  // Helper function to get feature status text
  const getFeatureStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expiring-soon': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return 'Not Available';
    }
  };

  // Helper function to get feature expiry date
  const getFeatureExpiryDate = (featureKey: string) => {
    if (!user?.userFeatures) return null;
    
    const userFeature = user.userFeatures.find(f => f.featureKey === featureKey);
    return userFeature ? new Date(userFeature.endDate) : null;
  };

  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 25px 50px -12px ${alpha(theme.palette.common.black, 0.25)}`,
          overflow: 'hidden',
          maxHeight: '90vh',
        }
      }}
      TransitionComponent={isMobile ? Slide : Fade}
      transitionDuration={300}
    >
      {/* Enhanced Header */}
      <DialogTitle sx={{ 
        p: { xs: 2, sm: 3 }, 
        pb: { xs: 1.5, sm: 2 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 80% 20%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%)`,
          pointerEvents: 'none',
        }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
        }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h2" sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  lineHeight: 1.2,
                }}>
                  Edit User
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mt: 0.5,
                }}>
                  Update {user.firstName} {user.lastName}&apos;s information and permissions
                </Typography>
              </Box>
            </Box>
            
            {/* User Info Summary */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mt: 2,
              opacity: 0.8,
            }}>
              <Chip
                icon={<PersonIcon />}
                label={`${user.firstName} ${user.lastName}`}
                size="small"
                variant="outlined"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
              />
              <Chip
                icon={<BusinessIcon />}
                label={user.companyName}
                size="small"
                variant="outlined"
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  borderColor: alpha(theme.palette.info.main, 0.2),
                }}
              />
              <Chip
                icon={roleConfig[user.role].icon}
                label={user.role.replace('_', ' ')}
                size="small"
                color={roleConfig[user.role].color as any}
                variant="outlined"
              />
            </Box>
          </Box>
          
          <IconButton 
            onClick={handleClose} 
            disabled={loading}
            sx={{ 
              color: theme.palette.text.secondary,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '&:hover': { 
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 }, 
        pt: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 2 },
        overflow: 'auto',
        maxHeight: 'calc(90vh - 200px)',
      }}>
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                }}
                onClose={() => setSaveError('')}
              >
                {saveError}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Layout - Using Box with flexbox instead of Grid */}
        <Box sx={{ 
          mt: 2,
          display: 'flex', 
          flexDirection: 'column',
          gap: { xs: 2.5, sm: 3 },
        }}>
          {/* First Row - First Name and Last Name */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2.5, sm: 3 },
          }}>
            {/* First Name */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }}
              >
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  error={!!getFieldError('firstName')}
                  helperText={getFieldError('firstName')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <PersonIcon fontSize="small" />
                      </Box>
                    ),
                    endAdornment: isFieldValid('firstName') && (
                      <CheckCircleIcon 
                        fontSize="small" 
                        color="success" 
                        sx={{ ml: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.75rem',
                      marginLeft: 0,
                    },
                  }}
                />
              </motion.div>
            </Box>

            {/* Last Name */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  error={!!getFieldError('lastName')}
                  helperText={getFieldError('lastName')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <PersonIcon fontSize="small" />
                      </Box>
                    ),
                    endAdornment: isFieldValid('lastName') && (
                      <CheckCircleIcon 
                        fontSize="small" 
                        color="success" 
                        sx={{ ml: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.75rem',
                      marginLeft: 0,
                    },
                  }}
                />
              </motion.div>
            </Box>
          </Box>

          {/* Email - Full Width */}
          <Box>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
            >
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={!!getFieldError('email')}
                helperText={getFieldError('email')}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                      <EmailIcon fontSize="small" />
                    </Box>
                  ),
                  endAdornment: isFieldValid('email') && (
                    <CheckCircleIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ ml: 1 }}
                    />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
                    marginLeft: 0,
                  },
                }}
              />
            </motion.div>
          </Box>

          {/* Second Row - Company Name and Role */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2.5, sm: 3 },
          }}>
            {/* Company Name */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }}
              >
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  onBlur={() => handleBlur('companyName')}
                  error={!!getFieldError('companyName')}
                  helperText={getFieldError('companyName')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <BusinessIcon fontSize="small" />
                      </Box>
                    ),
                    endAdornment: isFieldValid('companyName') && (
                      <CheckCircleIcon 
                        fontSize="small" 
                        color="success" 
                        sx={{ ml: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.75rem',
                      marginLeft: 0,
                    },
                  }}
                />
              </motion.div>
            </Box>

            {/* Role Selection */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 }}
              >
                <FormControl fullWidth error={!!getFieldError('role')} disabled={loading}>
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="User Role"
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    startAdornment={
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <SecurityIcon fontSize="small" />
                      </Box>
                    }
                    sx={{
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    }}
                  >
                    {Object.entries(roleConfig).map(([role]) => (
                      <MenuItem key={role} value={role} sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {role.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {getFieldError('role') && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {getFieldError('role')}
                    </Typography>
                  )}
                </FormControl>
              </motion.div>
            </Box>
          </Box>
        </Box>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon fontSize="small" />
              User Features & Permissions
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
              Use the checkboxes to enable or disable features for this user. Set custom end dates for each enabled feature.
            </Typography>
            
            {/* Feature Summary */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                Selected Features: {selectedFeatures.size} / {FEATURES ? Object.keys(FEATURES).length : 0}
              </Typography>
              {selectedFeatures.size > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Array.from(selectedFeatures).map(key => 
                    isValidFeatureKey(key) ? getFeatureDescription(key) : key
                  ).join(', ')}
                </Typography>
              )}
            </Box>
            
            {/* Features by Category */}
            {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => (
              <Box key={category} sx={{ mb: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  pb: 1,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}>
                  <Box sx={{ color: theme.palette.primary.main }}>
                    {categoryIcons[category as keyof typeof categoryIcons]}
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary,
                    textTransform: 'capitalize',
                  }}>
                    {category.replace('_', ' ')}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1.5,
                }}>
                  {features.map((featureKey) => {
                    const status = getFeatureStatus(featureKey);
                    const expiryDate = getFeatureExpiryDate(featureKey);
                    const isActive = status === 'active';
                    const isExpiringSoon = status === 'expiring-soon';
                    const isExpired = status === 'expired';
                    
                    return (
                      <Box
                        key={featureKey}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: isActive 
                            ? alpha(theme.palette.success.main, 0.05)
                            : isExpiringSoon 
                            ? alpha(theme.palette.warning.main, 0.05)
                            : isExpired 
                            ? alpha(theme.palette.error.main, 0.05)
                            : alpha(theme.palette.background.paper, 0.5),
                          border: `1px solid ${
                            isActive 
                              ? alpha(theme.palette.success.main, 0.2)
                              : isExpiringSoon 
                              ? alpha(theme.palette.warning.main, 0.2)
                              : isExpired 
                              ? alpha(theme.palette.error.main, 0.2)
                              : alpha(theme.palette.divider, 0.1)
                          }`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Box sx={{ 
                            color: isActive 
                              ? theme.palette.success.main
                              : isExpiringSoon 
                              ? theme.palette.warning.main
                              : isExpired 
                              ? theme.palette.error.main
                              : theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            {(() => {
                              switch (featureKey) {
                                case FEATURES.CHECK_INTERVAL_5MIN:
                                case FEATURES.CHECK_INTERVAL_1MIN:
                                case FEATURES.CHECK_INTERVAL_30SEC:
                                  return <ScheduleIcon fontSize="small" />;
                                case FEATURES.AI_DIAGNOSTICS_BASIC:
                                case FEATURES.AI_DIAGNOSTICS_ADVANCED:
                                case FEATURES.AI_DIAGNOSTICS_ENTERPRISE:
                                  return <PsychologyIcon fontSize="small" />;
                                case FEATURES.ALERTS_EMAIL:
                                  return <EmailAlertIcon fontSize="small" />;
                                case FEATURES.ALERTS_SLACK:
                                  return <ChatIcon fontSize="small" />;
                                case FEATURES.ALERTS_DISCORD:
                                  return <ChatIcon fontSize="small" />;
                                case FEATURES.PREDICTIVE_MONITORING:
                                case FEATURES.PREDICTIVE_MONITORING_ADVANCED:
                                  return <TrendingUpIcon fontSize="small" />;
                                case FEATURES.DNS_SSL_MONITORING:
                                  return <MonitorIcon fontSize="small" />;
                                case FEATURES.REPORT_PDF:
                                  return <CheckCircleIcon fontSize="small" />;
                                case FEATURES.LIFETIME_GUARANTEE:
                                  return <CheckCircleIcon fontSize="small" />;
                                default:
                                  return <CheckCircleIcon fontSize="small" />;
                              }
                            })()}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              color: isActive 
                                ? theme.palette.text.primary
                                : isExpiringSoon 
                                ? theme.palette.warning.dark
                                : isExpired 
                                ? theme.palette.error.dark
                                : theme.palette.text.secondary,
                            }}>
                              {isValidFeatureKey(featureKey) ? getFeatureDescription(featureKey) : featureKey}
                            </Typography>
                            
                            {/* End Date Input */}
                            {selectedFeatures.has(featureKey) && (
                              <Box sx={{ mt: 1 }}>
                                <TextField
                                  type="date"
                                  size="small"
                                  label="End Date"
                                  value={featureEndDates[featureKey] || ''}
                                  onChange={(e) => handleFeatureEndDateChange(featureKey, e.target.value)}
                                  InputProps={{
                                    sx: { fontSize: '0.75rem' }
                                  }}
                                  sx={{
                                    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                                    '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 },
                                    minWidth: 140,
                                  }}
                                />
                              </Box>
                            )}
                            
                            {expiryDate && (
                              <Typography variant="caption" sx={{ 
                                color: isActive 
                                  ? theme.palette.success.main
                                  : isExpiringSoon 
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                                fontWeight: 500,
                              }}>
                                Expires: {expiryDate.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {isExpiringSoon && ` (${Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)`}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedFeatures.has(featureKey)}
                                onChange={() => handleFeatureToggle(featureKey)}
                                color="primary"
                                size="small"
                                sx={{
                                  '&.Mui-checked': {
                                    color: isActive 
                                      ? theme.palette.success.main
                                      : isExpiringSoon 
                                      ? theme.palette.warning.main
                                      : isExpired 
                                      ? theme.palette.error.main
                                      : theme.palette.primary.main,
                                  },
                                }}
                              />
                            }
                            label=""
                            sx={{ mr: 0 }}
                          />
                          <Chip
                            label={getFeatureStatusText(status)}
                            size="small"
                            color={getFeatureStatusColor(status) as any}
                            variant="outlined"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon fontSize="small" />
              User Information
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              flexWrap: 'wrap',
            }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  User ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {user.id}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {new Date(user.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </DialogContent>

      {/* Enhanced Footer */}
      <Divider sx={{ opacity: 0.6 }} />
      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        pt: { xs: 2, sm: 2.5 },
        background: alpha(theme.palette.background.default, 0.3),
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            opacity: 0.7,
          }}>
            <Typography variant="caption" color="text.secondary">
              Changes will be applied immediately
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              onClick={handleCancel}
              variant="outlined"
              disabled={loading}
              startIcon={<CancelIcon />}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              startIcon={loading ? undefined : <SaveIcon />}
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.6)}`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: theme.palette.action.disabledBackground,
                  boxShadow: 'none',
                  transform: 'none',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </DialogActions>
    </Dialog>
  );
} 