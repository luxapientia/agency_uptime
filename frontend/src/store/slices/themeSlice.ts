import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ThemeState, ThemeSettings, ThemeColors } from '../../types/theme.types';
import axios from '../../lib/axios';

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

// Upload favicon
export const uploadFavicon = createAsyncThunk(
  'theme/uploadFavicon',
  async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/settings/favicon', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.filePath;
  }
);

// Upload logo
export const uploadLogo = createAsyncThunk(
  'theme/uploadLogo',
  async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.filePath;
  }
);

// Reset favicon to default
export const resetFavicon = createAsyncThunk(
  'theme/resetFavicon',
  async () => {
    await axios.delete('/settings/favicon');
    return 'favicon.png';
  }
);

// Reset logo to default
export const resetLogo = createAsyncThunk(
  'theme/resetLogo',
  async () => {
    await axios.delete('/settings/logo');
    return 'logo.png';
  }
);

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
    updateThemeSettings(state, action: PayloadAction<Partial<ThemeSettings>>) {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },
    resetTheme(state) {
      state.settings = initialState.settings;
    }
  },
  extraReducers: (builder) => {
    // Upload favicon
    builder
      .addCase(uploadFavicon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadFavicon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.favicon = action.payload;
      })
      .addCase(uploadFavicon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload favicon';
      });

    // Upload logo
    builder
      .addCase(uploadLogo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadLogo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.logo = action.payload;
      })
      .addCase(uploadLogo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload logo';
      });

    // Reset favicon
    builder
      .addCase(resetFavicon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetFavicon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.favicon = action.payload;
      })
      .addCase(resetFavicon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to reset favicon';
      });

    // Reset logo
    builder
      .addCase(resetLogo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetLogo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.logo = action.payload;
      })
      .addCase(resetLogo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to reset logo';
      });
  }
});

export const {
  updateColors,
  toggleDarkMode,
  updateBorderRadius,
  updateFontFamily,
  updateThemeSettings,
  resetTheme
} = themeSlice.actions;

export default themeSlice.reducer; 