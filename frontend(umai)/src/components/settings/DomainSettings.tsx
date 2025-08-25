import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Language as DomainIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import type { AppDispatch, RootState } from '../../store';
import { fetchDomainSettings, updateDomainSettings } from '../../store/slices/settingSlice';

export default function DomainSettings() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings.settings);
  const isLoading = useSelector((state: RootState) => state.settings.isLoading);
  const [domain, setDomain] = useState(settings.customDomain || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current domain on component mount
  useEffect(() => {
    dispatch(fetchDomainSettings());
  }, [dispatch]);

  // Update local state when settings change
  useEffect(() => {
    setDomain(settings.customDomain || '');
  }, [settings.customDomain]);

  const validateDomain = (value: string): boolean => {
    if (!value) return true; // Empty is valid (removes custom domain)
    
    // Basic domain validation regex
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(value);
  };

  const handleDomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDomain(value);
    
    if (value && !validateDomain(value)) {
      setError('Please enter a valid domain (e.g., example.com)');
    } else {
      setError('');
    }
  };

  const handleSave = async () => {
    if (!error) {
      try {
        setIsSaving(true);
        await dispatch(updateDomainSettings(domain || null)).unwrap();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemove = async () => {
    try {
      setIsSaving(true);
      await dispatch(updateDomainSettings(null)).unwrap();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isSaving) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
      }}
    >
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DomainIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6">Custom Domain</Typography>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 1 }}>
          Set up a custom domain to make your uptime monitoring dashboard accessible through your own domain name.
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Custom Domain"
            value={domain}
            onChange={handleDomainChange}
            error={!!error}
            helperText={error || 'Enter your domain without http:// or https:// (e.g., monitor.yourdomain.com)'}
            placeholder="monitor.yourdomain.com"
            disabled={isSaving}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ color: theme.palette.text.secondary, mr: 1 }}>
                  https://
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Save Domain">
              <IconButton
                onClick={handleSave}
                disabled={!!error || isSaving}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                {isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              </IconButton>
            </Tooltip>

            {settings.customDomain && (
              <Tooltip title="Remove Domain">
                <IconButton
                  onClick={handleRemove}
                  disabled={isSaving}
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.error.dark,
                    },
                  }}
                >
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : <DeleteIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {settings.customDomain && (
          <Alert severity="success" sx={{ borderRadius: 1 }}>
            Your dashboard is accessible at: <strong>https://{settings.customDomain}</strong>
          </Alert>
        )}

        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Important: After setting your custom domain, make sure to:
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Configure your DNS settings to point to our server</li>
            <li>Add a CNAME record pointing to our domain</li>
            <li>Wait for DNS propagation (may take up to 48 hours)</li>
          </ol>
        </Alert>
      </Stack>
    </Paper>
  );
} 