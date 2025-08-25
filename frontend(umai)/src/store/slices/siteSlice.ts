import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Site, CreateSiteData, UpdateSiteData, SiteState } from '../../types/site.types';
import axiosInstance from '../../lib/axios';
import { showToast } from '../../utils/toast';

const initialState: SiteState = {
  sites: [],
  isLoading: false,
  error: null,
  selectedSite: null,
};

export const fetchSites = createAsyncThunk('sites/fetchAll', async () => {
  const response = await axiosInstance.get('/sites');
  return response.data;
});

export const createSite = createAsyncThunk(
  'sites/create',
  async (data: CreateSiteData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/sites', data);
      showToast.success('Site created successfully');
      return response.data;
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create site');
      return rejectWithValue(error.response?.data?.message || 'Failed to create site');
    }
  }
);

export const updateSite = createAsyncThunk(
  'sites/update',
  async ({ id, data }: { id: string; data: UpdateSiteData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/sites/${id}`, data);
      showToast.success('Site updated successfully');
      return response.data;
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update site');
      return rejectWithValue(error.response?.data?.message || 'Failed to update site');
    }
  }
);

export const deleteSite = createAsyncThunk(
  'sites/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/sites/${id}`);
      showToast.success('Site deleted successfully');
      return id;
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete site');
      return rejectWithValue(error.response?.data?.message || 'Failed to delete site');
    }
  }
);

const siteSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    setSelectedSite: (state, action: PayloadAction<Site | null>) => {
      state.selectedSite = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sites
      .addCase(fetchSites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sites = action.payload;
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sites';
      })
      // Create site
      .addCase(createSite.fulfilled, (state, action) => {
        state.sites.push(action.payload);
      })
      // Update site
      .addCase(updateSite.fulfilled, (state, action) => {
        const index = state.sites.findIndex((site) => site.id === action.payload.id);
        if (index !== -1) {
          state.sites[index] = action.payload;
        }
      })
      // Delete site
      .addCase(deleteSite.fulfilled, (state, action) => {
        state.sites = state.sites.filter((site) => site.id !== action.payload);
      });
  },
});

export const { setSelectedSite, clearError } = siteSlice.actions;
export default siteSlice.reducer; 