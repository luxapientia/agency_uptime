import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SettingState, AgencySettings } from '../../types/setting.types';
import axios from '../../lib/axios';
import { showToast } from '../../utils/toast';

// Fetch theme settings
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const response = await axios.get('/settings');
    return response.data;
  }
);

// Update theme settings
export const updateThemeSettings = createAsyncThunk(
  'settings/updateThemeSettings',
  async ({ settings, save = true }: { settings: Partial<AgencySettings>; save?: boolean }) => {
    if (save) {
      const response = await axios.put('/settings/theme', settings);
      return { ...response.data, hasUnsavedChanges: false };
    }
    return { ...settings, hasUnsavedChanges: true };
  }
);

// Upload favicon
export const uploadFavicon = createAsyncThunk(
  'settings/uploadFavicon',
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
  'settings/uploadLogo',
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
  'settings/resetFavicon',
  async () => {
    await axios.delete('/settings/favicon');
    return 'favicon.png';
  }
);

// Reset logo to default
export const resetLogo = createAsyncThunk(
  'settings/resetLogo',
  async () => {
    await axios.delete('/settings/logo');
    return 'logo.png';
  }
);

// Fetch domain settings
export const fetchDomainSettings = createAsyncThunk(
  'settings/fetchDomainSettings',
  async () => {
    const response = await axios.get('/settings/domain');
    return response.data;
  }
);

// Update domain settings
export const updateDomainSettings = createAsyncThunk(
  'settings/updateDomainSettings',
  async (customDomain: string | null) => {
    const response = await axios.put('/settings/domain', { customDomain });
    return response.data;
  }
);

// Reset theme settings to default
export const resetThemeSettings = createAsyncThunk(
  'settings/resetThemeSettings',
  async () => {
    const response = await axios.delete('/settings/theme');
    return response.data;
  }
);

const initialState: SettingState = {
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
    hasUnsavedChanges: false,
    favicon: 'favicon.png',
    logo: 'logo.png',
    customDomain: null
  },
  isLoading: false,
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeSettings(state, action: PayloadAction<Partial<AgencySettings>>) {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    // Fetch settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.hasUnsavedChanges = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch theme settings';
      });

    // Update settings
    builder
      .addCase(updateThemeSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateThemeSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = {
          ...state.settings,
          ...action.payload
        };
        showToast.success('Theme settings updated successfully');
      })
      .addCase(updateThemeSettings.rejected, (state, action) => {
        state.isLoading = false;
        showToast.error('Failed to update theme settings');
        state.error = action.error.message || 'Failed to update theme settings';
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
        showToast.success('Favicon uploaded successfully');
      })
      .addCase(uploadFavicon.rejected, (state, action) => {
        state.isLoading = false;
        showToast.error('Failed to upload favicon');
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
        showToast.success('Logo uploaded successfully');
      })
      .addCase(uploadLogo.rejected, (state, action) => {
        state.isLoading = false;
        showToast.error('Failed to upload logo');
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
        showToast.success('Favicon reset successfully');
      })
      .addCase(resetFavicon.rejected, (state, action) => {
        state.isLoading = false;
        showToast.error('Failed to reset favicon');
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
        showToast.success('Logo reset successfully');
      })
      .addCase(resetLogo.rejected, (state, action) => {
        state.isLoading = false;
        showToast.error('Failed to reset logo');
        state.error = action.error.message || 'Failed to reset logo';
      });

    // Fetch domain settings
    builder
      .addCase(fetchDomainSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDomainSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.customDomain = action.payload.customDomain;
      })
      .addCase(fetchDomainSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch domain settings';
        showToast.error('Failed to fetch domain settings');
      });

    // Update domain settings
    builder
      .addCase(updateDomainSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDomainSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings.customDomain = action.payload.customDomain;
        showToast.success('Domain settings updated successfully');
        state.settings.hasUnsavedChanges = false;
      })
      .addCase(updateDomainSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update domain settings';
        showToast.error('Failed to update domain settings');
      });

    // Reset theme settings
    builder
      .addCase(resetThemeSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetThemeSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = {
          ...state.settings,
          ...action.payload,
          hasUnsavedChanges: false
        };
        showToast.success('Theme settings reset to default');
      })
      .addCase(resetThemeSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to reset theme settings';
        showToast.error('Failed to reset theme settings');
      });
  }
});

export const {
  setThemeSettings
} = settingsSlice.actions;

export default settingsSlice.reducer; 