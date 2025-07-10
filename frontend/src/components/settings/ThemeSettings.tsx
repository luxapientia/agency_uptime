import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Divider,
} from '@mui/material';
import type { GridProps } from '@mui/material';
import { ChromePicker } from 'react-color';
import type { ColorResult } from 'react-color';
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

export default function ThemeSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const themeSettings = useSelector((state: RootState) => state.theme.settings);

  const [displayColorPicker, setDisplayColorPicker] = useState<ColorPickerType>(null);
  const [tempColors, setTempColors] = useState<ThemeColors>(themeSettings.colors);

  const handleClick = (colorType: ColorPickerType) => {
    setDisplayColorPicker(colorType);
  };

  const handleClose = () => {
    setDisplayColorPicker(null);
  };

  const handleChange = (color: ColorResult, colorType: ColorPickerType) => {
    if (!colorType) return;

    setTempColors(prev => {
      if (colorType === 'text.primary') {
        return {
          ...prev,
          text: { ...prev.text, primary: color.hex }
        };
      }
      if (colorType === 'text.secondary') {
        return {
          ...prev,
          text: { ...prev.text, secondary: color.hex }
        };
      }
      if (colorType === 'text') {
        return prev;
      }
      return {
        ...prev,
        [colorType]: color.hex
      };
    });
  };

  const handleSave = () => {
    dispatch(updateColors(tempColors));
    handleClose();
  };

  const handleReset = () => {
    dispatch(resetTheme());
    setTempColors(themeSettings.colors);
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
                color={currentColor}
                onChange={(color) => handleChange(color, colorType)}
              />
            </Box>
          )}
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