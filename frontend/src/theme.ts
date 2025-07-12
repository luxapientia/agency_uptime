import { createTheme } from '@mui/material';
import type { Theme, PaletteMode } from '@mui/material';
import type { AgencySettings } from './types/setting.types';

export const createAppTheme = (settings: AgencySettings): Theme => {
  const mode: PaletteMode = settings.isDarkMode ? 'dark' : 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: settings.colors.primary,
        light: adjustColor(settings.colors.primary, 20),
        dark: adjustColor(settings.colors.primary, -20),
      },
      secondary: {
        main: settings.colors.secondary,
        light: adjustColor(settings.colors.secondary, 20),
        dark: adjustColor(settings.colors.secondary, -20),
      },
      error: {
        main: settings.colors.error,
        light: adjustColor(settings.colors.error, 20),
        dark: adjustColor(settings.colors.error, -20),
      },
      warning: {
        main: settings.colors.warning,
        light: adjustColor(settings.colors.warning, 20),
        dark: adjustColor(settings.colors.warning, -20),
      },
      info: {
        main: settings.colors.info,
        light: adjustColor(settings.colors.info, 20),
        dark: adjustColor(settings.colors.info, -20),
      },
      success: {
        main: settings.colors.success,
        light: adjustColor(settings.colors.success, 20),
        dark: adjustColor(settings.colors.success, -20),
      },
      text: {
        primary: settings.colors.text.primary,
        secondary: settings.colors.text.secondary,
      },
      background: {
        default: settings.isDarkMode ? '#121212' : '#f9fafb',
        paper: settings.isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: settings.fontFamily.primary,
      h1: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      h2: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      h3: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      h4: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      h5: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      h6: {
        fontWeight: 600,
        fontFamily: settings.fontFamily.primary,
      },
      body1: {
        fontFamily: settings.fontFamily.secondary,
      },
      body2: {
        fontFamily: settings.fontFamily.secondary,
      },
    },
    shape: {
      borderRadius: settings.borderRadius,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: settings.borderRadius,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            borderRadius: settings.borderRadius,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: settings.borderRadius,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: settings.borderRadius,
          },
        },
      },
    },
  });
};

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust each component
  const adjustR = Math.floor(r * (1 + percent / 100));
  const adjustG = Math.floor(g * (1 + percent / 100));
  const adjustB = Math.floor(b * (1 + percent / 100));

  // Ensure values are within 0-255 range
  const finalR = Math.min(255, Math.max(0, adjustR));
  const finalG = Math.min(255, Math.max(0, adjustG));
  const finalB = Math.min(255, Math.max(0, adjustB));

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
} 