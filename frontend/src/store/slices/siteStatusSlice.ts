import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SiteStatus } from '../../types/site.types';
import axiosInstance from '../../lib/axios';
import type { SiteStatusUpdate } from '../../types/socket.types';

interface SiteStatusState {
  statuses: Record<string, SiteStatus>;
  statusHistory: Record<string, SiteStatus[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: SiteStatusState = {
  statuses: {},
  statusHistory: {},
  isLoading: false,
  error: null,
};

export const fetchAllSiteStatuses = createAsyncThunk(
  'siteStatus/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/sites/statuses');
      const sites = response.data;
        const result: Record<string, SiteStatus> = {};
      sites.forEach((site: any) => {
        result[site.id] = site.statuses[0];
      });
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch site statuses');
    }
  }
);

export const fetchSiteStatus = createAsyncThunk(
  'siteStatus/fetch',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sites/${siteId}/status`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch site status');
    }
  }
);

export const fetchSiteStatusHistory = createAsyncThunk(
  'siteStatus/fetchHistory',
  async ({ siteId, hours = 24 }: { siteId: string; hours?: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sites/${siteId}/status/history?hours=${hours}`);
      console.log(response.data);
      return { siteId, history: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch site status history');
    }
  }
);

const siteStatusSlice = createSlice({
  name: 'siteStatus',
  initialState,
  reducers: {
    updateSiteStatus: (state: SiteStatusState, action: { payload: SiteStatusUpdate }) => {
      const newStatus = action.payload.status;
      const siteId = action.payload.siteId;
      state.statuses[siteId] = newStatus;
    }
  },
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
      })
      .addCase(fetchSiteStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSiteStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statuses[action.payload.siteId] = action.payload;
      })
      .addCase(fetchSiteStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSiteStatusHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSiteStatusHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statusHistory[action.payload.siteId] = action.payload.history;
      })
      .addCase(fetchSiteStatusHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { updateSiteStatus } = siteStatusSlice.actions;
export default siteStatusSlice.reducer; 