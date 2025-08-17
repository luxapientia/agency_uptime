import { useState } from 'react';
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
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

import type { UserRole } from '../../types/auth.types';
import adminService from '../../services/admin.service';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  loading?: boolean;
}

const roleConfig = {
  USER: { color: 'default' as const, icon: <PersonIcon fontSize="small" />, description: 'Standard user with basic access' },
  ADMIN: { color: 'warning' as const, icon: <SecurityIcon fontSize="small" />, description: 'Administrator with elevated privileges' },
  SUPER_ADMIN: { color: 'error' as const, icon: <SecurityIcon fontSize="small" />, description: 'Super administrator with full system access' },
} as const;

export default function AddUserModal({ 
  open, 
  onClose, 
  onUserCreated,
  loading = false 
}: AddUserModalProps) {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    role: 'USER' as UserRole,
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string>('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaveError('');
      
      // Create new user
      await adminService.createUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName.trim(),
        role: formData.role,
        password: formData.password,
      });

      onUserCreated();
      handleClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      role: 'USER',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setSaveError('');
    setTouched({});
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.15)}`,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: { xs: 2, sm: 3 }, 
        pb: 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}>
              <PersonIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Create New User
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Add a new user to the system with custom permissions
              </Typography>
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

        {/* Form Layout */}
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
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
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
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>
          </Box>

          {/* Second Row - Email and Company */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2.5, sm: 3 },
          }}>
            {/* Email */}
            <Box sx={{ flex: 1 }}>
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
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>

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
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>
          </Box>

          {/* Third Row - Password and Confirm Password */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2.5, sm: 3 },
          }}>
            {/* Password */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 }}
              >
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={!!getFieldError('password')}
                  helperText={getFieldError('password')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <SecurityIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>

            {/* Confirm Password */}
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.6 }}
              >
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={!!getFieldError('confirmPassword')}
                  helperText={getFieldError('confirmPassword')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <SecurityIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>
          </Box>

          {/* Fourth Row - Role */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2.5, sm: 3 },
          }}>
            <Box sx={{ flex: 1 }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.7 }}
              >
                <FormControl fullWidth error={!!getFieldError('role')}>
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    onBlur={() => handleBlur('role')}
                    disabled={loading}
                    startAdornment={
                      <Box sx={{ mr: 1, color: theme.palette.text.secondary }}>
                        <SecurityIcon fontSize="small" />
                      </Box>
                    }
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    }}
                  >
                    {Object.entries(roleConfig).map(([role, config]) => (
                      <MenuItem key={role} value={role}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: theme.palette.text.secondary }}>
                            {config.icon}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {role.replace('_', ' ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {config.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {getFieldError('role') && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {getFieldError('role')}
                    </Typography>
                  )}
                </FormControl>
              </motion.div>
            </Box>
          </Box>
        </Box>


      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        pt: 1,
        gap: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.default, 0.5),
      }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          startIcon={<CancelIcon />}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          startIcon={<SaveIcon />}
          variant="contained"
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );
} 