import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Close as CloseIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { Site, CreateSiteData } from '../../types/site.types';

interface SiteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSiteData) => void;
  site?: Site | null;
  isLoading?: boolean;
}

const INTERVAL_OPTIONS = [1, 5];

export default function SiteForm({ open, onClose, onSubmit, site, isLoading }: SiteFormProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    url: '',
    checkInterval: 1,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        url: site.url,
        checkInterval: site.checkInterval,
        isActive: site.isActive,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: 1,
        isActive: true,
      });
    }
    setErrors({});
  }, [site]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData as CreateSiteData);
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
                {INTERVAL_OPTIONS.map((interval) => (
                  <MenuItem key={interval} value={interval}>
                    Every {interval} minute{interval > 1 ? 's' : ''}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                  Choose how often the site should be checked
                </Box>
              </FormHelperText>
            </FormControl>

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