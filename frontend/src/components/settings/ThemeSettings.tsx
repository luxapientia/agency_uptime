import { useState } from 'react';
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
  Divider,
} from '@mui/material';
import { ChromePicker } from 'react-color';
import type { ColorResult, RGBColor } from 'react-color';
import type { RootState, AppDispatch } from '../../store';
import {
  updateColors,
  toggleDarkMode,
  updateBorderRadius,
  updateFontFamily,
  resetTheme,
} from '../../store/slices/themeSlice';
import type { ThemeColors } from '../../types/theme.types';

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
  const dispatch = useDispatch<AppDispatch>();
  const themeSettings = useSelector((state: RootState) => state.theme.settings);

  const [displayColorPicker, setDisplayColorPicker] = useState<ColorPickerType>(null);
  const [tempColors, setTempColors] = useState<ThemeColors>(() => {
    // Initialize with rgba values
    const colors = { ...themeSettings.colors };
    Object.keys(colors).forEach(key => {
      if (key === 'text') {
        colors.text = {
          primary: hexToRgba(colors.text.primary),
          secondary: hexToRgba(colors.text.secondary)
        };
      } else {
        colors[key as keyof Omit<ThemeColors, 'text'>] = hexToRgba(colors[key as keyof Omit<ThemeColors, 'text'>]);
      }
    });
    return colors;
  });

  const handleClick = (colorType: ColorPickerType) => {
    setDisplayColorPicker(colorType);
  };

  const handleClose = () => {
    setDisplayColorPicker(null);
  };

  const handleChange = (color: ColorResult, colorType: ColorPickerType) => {
    if (!colorType) return;

    const rgba = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;

    setTempColors(prev => {
      if (colorType === 'text.primary') {
        return {
          ...prev,
          text: { ...prev.text, primary: rgba }
        };
      }
      if (colorType === 'text.secondary') {
        return {
          ...prev,
          text: { ...prev.text, secondary: rgba }
        };
      }
      if (colorType === 'text') {
        return prev;
      }
      return {
        ...prev,
        [colorType]: rgba
      };
    });
  };

  const handleSave = () => {
    // Convert rgba values back to hex for storage
    const hexColors = { ...tempColors };
    Object.keys(hexColors).forEach(key => {
      if (key === 'text') {
        hexColors.text = {
          primary: rgbaToHexAndAlpha(hexColors.text.primary).hex,
          secondary: rgbaToHexAndAlpha(hexColors.text.secondary).hex
        };
      } else {
        hexColors[key as keyof Omit<ThemeColors, 'text'>] = 
          rgbaToHexAndAlpha(hexColors[key as keyof Omit<ThemeColors, 'text'>]).hex;
      }
    });
    dispatch(updateColors(hexColors));
    handleClose();
  };

  const handleReset = () => {
    dispatch(resetTheme());
    // Reset tempColors with rgba values
    setTempColors(() => {
      const colors = { ...themeSettings.colors };
      Object.keys(colors).forEach(key => {
        if (key === 'text') {
          colors.text = {
            primary: hexToRgba(colors.text.primary),
            secondary: hexToRgba(colors.text.secondary)
          };
        } else {
          colors[key as keyof Omit<ThemeColors, 'text'>] = 
            hexToRgba(colors[key as keyof Omit<ThemeColors, 'text'>]);
        }
      });
      return colors;
    });
  };

  const handleBorderRadiusChange = (_event: Event, value: number | number[]) => {
    dispatch(updateBorderRadius(value as number));
  };

  const handleFontFamilyChange = (type: 'primary' | 'secondary', value: string) => {
    dispatch(updateFontFamily({ [type]: value }));
  };

  const renderColorPicker = (colorType: ColorPickerType) => {
    if (!colorType || colorType === 'text') return null;

    let currentColor = '';
    if (colorType === 'text.primary') {
      currentColor = tempColors.text.primary;
    } else if (colorType === 'text.secondary') {
      currentColor = tempColors.text.secondary;
    } else {
      currentColor = tempColors[colorType];
    }

    // Convert rgba to color object for ChromePicker
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

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Theme Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={themeSettings.isDarkMode}
              onChange={() => dispatch(toggleDarkMode())}
            />
          }
          label="Dark Mode"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Border Radius
      </Typography>
      <Box sx={{ px: 2, mb: 3 }}>
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
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Font Family
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Box>
          <TextField
            fullWidth
            label="Primary Font"
            value={themeSettings.fontFamily.primary}
            onChange={(e) => handleFontFamilyChange('primary', e.target.value)}
            size="small"
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Secondary Font"
            value={themeSettings.fontFamily.secondary}
            onChange={(e) => handleFontFamilyChange('secondary', e.target.value)}
            size="small"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Colors
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: 3, 
        mb: 3 
      }}>
        {(Object.keys(colorLabels) as (keyof typeof colorLabels)[]).map((colorType) => (
          <Box key={colorType}>
            {renderColorPicker(colorType)}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={JSON.stringify(tempColors) === JSON.stringify(themeSettings.colors)}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          Reset to Default
        </Button>
      </Box>
    </Paper>
  );
} 