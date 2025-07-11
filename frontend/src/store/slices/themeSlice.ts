import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ThemeState, ThemeSettings, ThemeColors } from '../../types/theme.types';
import axios from '../../lib/axios';

// Fetch theme settings
export const fetchThemeSettings = createAsyncThunk(
  'theme/fetchSettings',
  async () => {
    const response = await axios.get('/settings');
    return response.data;
  }
);

// Toggle dark mode
export const toggleDarkMode = createAsyncThunk(
  'theme/toggleDarkMode',
  async () => {
    const response = await axios.post('/settings/dark-mode');
    return response.data.isDarkMode;
  }
);

// Update border radius
export const updateBorderRadius = createAsyncThunk(
  'theme/updateBorderRadius',
  async (borderRadius: number) => {
    const response = await axios.put('/settings/border-radius', { borderRadius });
    return response.data.borderRadius;
  }
);

// Update font family
export const updateFontFamily = createAsyncThunk(
  'theme/updateFontFamily',
  async ({ primary, secondary }: { primary?: string; secondary?: string }) => {
    const response = await axios.put('/settings/font-family', { primary, secondary });
    return response.data.fontFamily;
  }
);

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

// Update colors
export const updateColors = createAsyncThunk(
  'theme/updateColors',
  async (colors: ThemeColors) => {
    const response = await axios.put('/settings/colors', colors);
    return response.data.colors;
  }
);

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
    // Fetch settings
    builder
      .addCase(fetchThemeSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThemeSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchThemeSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch theme settings';
      });

    // Toggle dark mode
    builder
      .addCase(toggleDarkMode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleDarkMode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.isDarkMode = action.payload;
      })
      .addCase(toggleDarkMode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to toggle dark mode';
      });

    // Update border radius
    builder
      .addCase(updateBorderRadius.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBorderRadius.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.borderRadius = action.payload;
      })
      .addCase(updateBorderRadius.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update border radius';
      });

    // Update font family
    builder
      .addCase(updateFontFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFontFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.fontFamily = action.payload;
      })
      .addCase(updateFontFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update font family';
      });

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

    // Update colors
    builder
      .addCase(updateColors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateColors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.colors = action.payload;
      })
      .addCase(updateColors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update colors';
      });
  }
});

export const {
  updateThemeSettings,
  resetTheme
} = themeSlice.actions;

export default themeSlice.reducer; 