import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Stack,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChromePicker } from 'react-color';
import type { ColorResult, RGBColor } from 'react-color';
import {
  Upload as UploadIcon,
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  BorderAll as BorderIcon,
  TextFields as TextIcon,
  Refresh as ResetIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { RootState, AppDispatch } from '../../store';
import {
  updateThemeSettings,
  resetTheme,
  uploadFavicon,
  uploadLogo,
  resetLogo,
  resetFavicon,
  fetchSettings
} from '../../store/slices/settingSlice';
import type { ThemeColors } from '../../types/setting.types';

type ColorPickerType = keyof ThemeColors | 'text.primary' | 'text.secondary' | null;

const colorLabels: Record<Exclude<ColorPickerType, null>, string> = {
  primary: 'Primary Color',
  secondary: 'Secondary Color',
  error: 'Error Color',
  warning: 'Warning Color',
  info: 'Info Color',
  success: 'Success Color',
  text: 'Text Colors',
  'text.primary': 'Primary Text Color',
  'text.secondary': 'Secondary Text Color',
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${alpha})`;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to convert rgba to hex and alpha
const rgbaToHexAndAlpha = (rgba: string): { hex: string; alpha: number } => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
  if (!match) return { hex: '#000000', alpha: 1 };

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;

  const hex = '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return { hex, alpha: a };
};

export default function ThemeSettings() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const themeSettings = useSelector((state: RootState) => state.settings.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [previewFavicon, setPreviewFavicon] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [displayColorPicker, setDisplayColorPicker] = useState<ColorPickerType>(null);

  const handleClick = (colorType: ColorPickerType) => {
    setDisplayColorPicker(colorType);
  };

  const handleClose = () => {
    setDisplayColorPicker(null);
  };

  const handleChange = (color: ColorResult, colorType: ColorPickerType) => {
    if (!colorType) return;

    const newColors = { ...themeSettings.colors };
    const hex = `#${color.hex.substring(1)}`;

    if (colorType === 'text.primary') {
      newColors.text = { ...newColors.text, primary: hex };
    } else if (colorType === 'text.secondary') {
      newColors.text = { ...newColors.text, secondary: hex };
    } else if (colorType !== 'text') {
      newColors[colorType] = hex;
    }

    dispatch(updateThemeSettings({ 
      settings: { colors: newColors },
      save: false 
    }));
  };

  const handleReset = () => {
    dispatch(resetTheme());
  };

  const handleBorderRadiusChange = (_event: Event, value: number | number[]) => {
    dispatch(updateThemeSettings({ 
      settings: { borderRadius: value as number },
      save: false 
    }));
  };

  const handleFontFamilyChange = (type: 'primary' | 'secondary', value: string) => {
    dispatch(updateThemeSettings({ 
      settings: { 
        fontFamily: { 
          ...themeSettings.fontFamily, 
          [type]: value 
        } 
      },
      save: false 
    }));
  };

  const handleDarkModeToggle = () => {
    dispatch(updateThemeSettings({ 
      settings: { isDarkMode: !themeSettings.isDarkMode },
      save: false 
    }));
  };

  const handleSaveAll = () => {
    // Save all current settings to the server
    dispatch(updateThemeSettings({ 
      settings: themeSettings,
      save: true 
    }));  
    handleClose();
  };

  const handleCancelChanges = () => {
    // Fetch current settings from backend
    dispatch(fetchSettings());
    handleClose();
  };

  const handleFaviconSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image and not too large
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      alert('File size should be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Create a new image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Check dimensions
        if (img.width > 256 || img.height > 256) {
          alert('Image dimensions should be 256x256 pixels or smaller');
          return;
        }

        // Only update preview
        setPreviewFavicon(dataUrl);
        setSelectedFile(file);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpdate = () => {
    if (selectedFile && previewFavicon) {
      // Update favicon in the store
      dispatch(uploadFavicon(selectedFile));
      // Clear preview state
      setPreviewFavicon(null);
      setSelectedFile(null);
    }
  };

  const handleRemoveFavicon = () => {
    dispatch(resetFavicon());
    fileInputRef.current!.value = '';
    setPreviewFavicon(null);
    setSelectedFile(null);
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image and not too large
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('File size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Create a new image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Check dimensions (max 800px)
        if (img.width > 800 || img.height > 800) {
          alert('Image dimensions should be 800x800 pixels or smaller');
          return;
        }

        // Only update preview
        setPreviewLogo(dataUrl);
        setSelectedLogoFile(file);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpdate = () => {
    if (selectedLogoFile && previewLogo) {
      // Update logo in the store
      dispatch(uploadLogo(selectedLogoFile));
      // Clear preview state
      setPreviewLogo(null);
      setSelectedLogoFile(null);
    }
  };

  const handleRemoveLogo = () => {
    dispatch(resetLogo());
    logoFileInputRef.current!.value = '';
    setPreviewLogo(null);
    setSelectedLogoFile(null);
  };

  const renderColorPicker = (colorType: ColorPickerType) => {
    if (!colorType || colorType === 'text') return null;

    let currentColor = '';
    if (colorType === 'text.primary') {
      currentColor = hexToRgba(themeSettings.colors.text.primary);
    } else if (colorType === 'text.secondary') {
      currentColor = hexToRgba(themeSettings.colors.text.secondary);
    } else {
      currentColor = hexToRgba(themeSettings.colors[colorType]);
    }

    // Convert hex to color object for ChromePicker
    const { hex, alpha } = rgbaToHexAndAlpha(currentColor);
    const rgbColor: RGBColor = {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
      a: alpha
    };

    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {colorLabels[colorType as keyof typeof colorLabels]}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            onClick={() => handleClick(colorType)}
            sx={{
              width: 100,
              height: 40,
              backgroundColor: currentColor,
              cursor: 'pointer',
              border: '2px solid #e0e0e0',
              borderRadius: 1,
              backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")',
            }}
          />
          {displayColorPicker === colorType && (
            <Box sx={{
              position: 'absolute',
              zIndex: 2,
              mt: '240px',
            }}>
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
                onClick={handleClose}
              />
              <ChromePicker
                color={rgbColor}
                onChange={(color) => handleChange(color, colorType)}
                disableAlpha={false}
              />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            {currentColor}
          </Typography>
        </Box>
      </Box>
    );
  };

  const SectionTitle = ({ icon, title }: { icon: React.ReactElement; title: string }) => {
    const theme = useTheme();
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Box sx={{ color: theme.palette.primary.main }}>
          {icon}
        </Box>
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
      </Box>
    );
  };

  const SettingsCard = ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();
    return (
      <Box
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        {children}
      </Box>
    );
  };

  return (
    <Stack spacing={3}>
      {/* Site Icons Section */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
        }}
      >
        <SectionTitle icon={<ImageIcon />} title="Site Icons" />
        <Box sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* Favicon */}
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                Favicon
              </Typography>
              <SettingsCard>
                <Stack spacing={3}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 4, 
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {/* Preview Container */}
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2 
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                        Current Favicon
                      </Typography>
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: theme.shadows[3],
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          '&:hover .preview-overlay': {
                            opacity: 1,
                          },
                        }}
                      >
                        {(previewFavicon || themeSettings.favicon) ? (
                          <>
                            <img
                              src={previewFavicon || themeSettings.favicon}
                              alt="Favicon"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <Box
                              className="preview-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: alpha(theme.palette.common.black, 0.5),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                cursor: 'pointer',
                              }}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <UploadIcon sx={{ color: '#fff', fontSize: 32 }} />
                            </Box>
                          </>
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadIcon sx={{ color: theme.palette.primary.main, fontSize: 32, mb: 1 }} />
                            <Typography variant="caption" color="primary" align="center">
                              Click to Upload
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Browser Preview */}
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Browser Preview
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          border: `1px solid ${theme.palette.divider}`,
                        }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 0.5,
                              overflow: 'hidden',
                              backgroundColor: '#fff',
                            }}
                          >
                            {(previewFavicon || themeSettings.favicon) && (
                              <img
                                src={previewFavicon || themeSettings.favicon}
                                alt="Favicon"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                            Your Website Title
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFaviconSelect}
                      accept="image/x-icon,image/png"
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={<UploadIcon />}
                      sx={{
                        borderRadius: '12px',
                        py: 1,
                        px: 3,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Select File
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleFaviconUpdate}
                      disabled={!selectedFile || !previewFavicon}
                      sx={{
                        borderRadius: '12px',
                        py: 1,
                        px: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                        },
                      }}
                    >
                      Update Favicon
                    </Button>
                    <Tooltip 
                      title="Reset to default favicon"
                      placement="top"
                      arrow
                    >
                      <span>
                        <IconButton
                          onClick={handleRemoveFavicon}
                          disabled={!themeSettings.favicon && !previewFavicon}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            color: theme.palette.error.main,
                            border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              borderColor: theme.palette.error.main,
                              transform: 'translateY(-2px)',
                            },
                            '&:disabled': {
                              borderColor: alpha(theme.palette.error.main, 0.1),
                              color: alpha(theme.palette.error.main, 0.3),
                            },
                            '& .MuiSvgIcon-root': {
                              fontSize: 20,
                              transition: 'transform 0.2s ease-in-out',
                            },
                            '&:hover .MuiSvgIcon-root': {
                              transform: 'rotate(-45deg)',
                            }
                          }}
                        >
                          <ResetIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Stack>
              </SettingsCard>
              <Box sx={{ px: 2 }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  • Recommended size: 32x32 pixels
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  • Supported formats: ICO, PNG
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  • Maximum file size: 1MB
                </Typography>
              </Box>
            </Stack>

            {/* Logo */}
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                Logo
              </Typography>
              <SettingsCard>
                <Stack spacing={3} alignItems="center">
                  <Box
                    sx={{
                      height: 200,
                      aspectRatio: 1,
                      borderRadius: 1,
                      overflow: 'hidden',
                      boxShadow: theme.shadows[2],
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                    }}
                  >
                    {(previewLogo || themeSettings.logo) ? (
                      <img
                        src={previewLogo || themeSettings.logo}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <ImageIcon color="disabled" sx={{ fontSize: 48 }} />
                    )}
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoSelect}
                      accept="image/png,image/jpeg,image/svg+xml"
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => logoFileInputRef.current?.click()}
                      startIcon={<UploadIcon />}
                      sx={{ borderRadius: theme.shape.borderRadius }}
                    >
                      Select File
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleLogoUpdate}
                      disabled={!selectedLogoFile || !previewLogo}
                      sx={{
                        borderRadius: theme.shape.borderRadius,
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                          : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`
                            : `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                        },
                      }}
                    >
                      Update Logo
                    </Button>
                    <Tooltip 
                      title="Reset to default favicon"
                      placement="top"
                      arrow
                    >
                      <span>
                        <IconButton
                          onClick={handleRemoveLogo}
                          disabled={!themeSettings.logo && !previewLogo}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            color: theme.palette.error.main,
                            border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              borderColor: theme.palette.error.main,
                              transform: 'translateY(-2px)',
                            },
                            '&:disabled': {
                              borderColor: alpha(theme.palette.error.main, 0.1),
                              color: alpha(theme.palette.error.main, 0.3),
                            },
                            '& .MuiSvgIcon-root': {
                              fontSize: 20,
                              transition: 'transform 0.2s ease-in-out',
                            },
                            '&:hover .MuiSvgIcon-root': {
                              transform: 'rotate(-45deg)',
                            }
                          }}
                        >
                          <ResetIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </SettingsCard>
              <Typography variant="caption" color="text.secondary">
                • Maximum dimensions: 800x800 pixels
                <br />
                • Supported formats: PNG, JPEG, SVG
                <br />
                • Recommended: SVG with transparency
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Theme Controls */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
        }}
      >
        <SectionTitle icon={<PaletteIcon />} title="Theme Controls" />
        <Box sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* Appearance & Border Radius */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
              {/* Dark Mode */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                  Appearance
                </Typography>
                <SettingsCard>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeSettings.isDarkMode}
                        onChange={handleDarkModeToggle}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <DarkModeIcon color={themeSettings.isDarkMode ? "primary" : "disabled"} />
                        <Typography>Dark Mode</Typography>
                      </Stack>
                    }
                  />
                </SettingsCard>
              </Stack>

              {/* Border Radius */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                  Border Radius
                </Typography>
                <SettingsCard>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <BorderIcon color="primary" />
                      <Slider
                        value={themeSettings.borderRadius}
                        min={0}
                        max={24}
                        step={1}
                        onChange={handleBorderRadiusChange}
                        valueLabelDisplay="auto"
                        marks={[
                          { value: 0, label: '0' },
                          { value: 8, label: '8' },
                          { value: 16, label: '16' },
                          { value: 24, label: '24' },
                        ]}
                        sx={{
                          '& .MuiSlider-markLabel': {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </SettingsCard>
              </Stack>
            </Stack>

            {/* Typography */}
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                Typography
              </Typography>
              <SettingsCard>
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Stack spacing={2} sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextIcon color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Primary Font
                        </Typography>
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        value={themeSettings.fontFamily.primary}
                        onChange={(e) => handleFontFamilyChange('primary', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                          },
                        }}
                      />
                    </Stack>
                    <Stack spacing={2} sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextIcon color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Secondary Font
                        </Typography>
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        value={themeSettings.fontFamily.secondary}
                        onChange={(e) => handleFontFamilyChange('secondary', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </SettingsCard>
            </Stack>

            {/* Colors */}
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
                Colors
              </Typography>
              <SettingsCard>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                      },
                      gap: 3,
                    }}
                  >
                    {(Object.keys(colorLabels) as (keyof typeof colorLabels)[]).map((colorType) => (
                      <Box key={colorType}>
                        {renderColorPicker(colorType)}
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </SettingsCard>
            </Stack>
          </Stack>

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              variant="contained"
              onClick={handleSaveAll}
              disabled={!themeSettings.hasUnsavedChanges}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: theme.shape.borderRadius,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                  : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`
                    : `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                },
              }}
            >
              Save Changes
            </Button>
            {themeSettings.hasUnsavedChanges && (
              <Button
                variant="outlined"
                onClick={handleCancelChanges}
                startIcon={<CancelIcon />}
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                Cancel Changes
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<ResetIcon />}
              sx={{
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Reset to Default
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
} 