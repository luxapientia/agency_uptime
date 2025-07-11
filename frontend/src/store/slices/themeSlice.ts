import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ThemeState, ThemeSettings, ThemeColors } from '../../types/theme.types';

const initialState: ThemeState = {
  settings: {
    colors: {
      primary: '#2563eb',
      secondary: '#4f46e5',
      error: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6',
      success: '#10b981',
      text: {
        primary: '#111827',
        secondary: '#4b5563'
      }
    },
    isDarkMode: false,
    borderRadius: 4,
    fontFamily: {
      primary: 'Inter',
      secondary: 'Roboto'
    },
    favicon: 'favicon.png',
    logo: 'logo.png'
  },
  isLoading: false,
  error: null
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    updateColors(state, action: PayloadAction<ThemeColors>) {
      state.settings.colors = action.payload;
    },
    toggleDarkMode(state) {
      state.settings.isDarkMode = !state.settings.isDarkMode;
    },
    updateBorderRadius(state, action: PayloadAction<number>) {
      state.settings.borderRadius = action.payload;
    },
    updateFontFamily(state, action: PayloadAction<{ primary?: string; secondary?: string }>) {
      state.settings.fontFamily = {
        ...state.settings.fontFamily,
        ...action.payload
      };
    },
    updateFavicon(state, action: PayloadAction<string>) {
      state.settings.favicon = action.payload;
    },
    updateLogo(state, action: PayloadAction<string>) {
      state.settings.logo = action.payload;
    },
    updateThemeSettings(state, action: PayloadAction<Partial<ThemeSettings>>) {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },
    resetTheme(state) {
      state.settings = initialState.settings;
    }
  }
});

export const {
  updateColors,
  toggleDarkMode,
  updateBorderRadius,
  updateFontFamily,
  updateFavicon,
  updateLogo,
  updateThemeSettings,
  resetTheme
} = themeSlice.actions;

export default themeSlice.reducer; 