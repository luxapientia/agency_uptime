import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SiteStatus } from '../../types/site.types';
import axiosInstance from '../../lib/axios';

interface SiteStatusState {
  statuses: Record<string, SiteStatus[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: SiteStatusState = {
  statuses: {},
  isLoading: false,
  error: null,
};

export const fetchAllSiteStatuses = createAsyncThunk(
  'siteStatus/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/sites/statuses');
      const sites = response.data;
      const result: Record<string, SiteStatus[]> = {};
      sites.forEach((site: any) => {
        result[site.id] = site.statuses;
      });
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch site statuses');
    }
  }
);

const siteStatusSlice = createSlice({
  name: 'siteStatus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSiteStatuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSiteStatuses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statuses = action.payload;
      })
      .addCase(fetchAllSiteStatuses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export default siteStatusSlice.reducer; 