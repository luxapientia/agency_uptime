import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { WorkerState, WorkersResponse, WorkerIdsResponse } from '../../types/worker.types';
import axiosInstance from '../../lib/axios';
import { showToast } from '../../utils/toast';

const initialState: WorkerState = {
  workers: [],
  workerIds: [],
  isLoading: false,
  error: null,
};

// Fetch all workers with detailed information
export const fetchWorkers = createAsyncThunk(
  'workers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<WorkersResponse>('/workers');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch workers';
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch only worker IDs (simplified)
export const fetchWorkerIds = createAsyncThunk(
  'workers/fetchIds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<WorkerIdsResponse>('/workers/ids');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch worker IDs';
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const workerSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateWorkerHeartbeat: (state, action: PayloadAction<{ workerId: string; lastHeartbeat: string }>) => {
      const worker = state.workers.find(w => w.workerId === action.payload.workerId);
      if (worker) {
        worker.lastHeartbeat = action.payload.lastHeartbeat;
      }
    },
    updateWorkerActiveSites: (state, action: PayloadAction<{ workerId: string; activeSites: number }>) => {
      const worker = state.workers.find(w => w.workerId === action.payload.workerId);
      if (worker) {
        worker.activeSites = action.payload.activeSites;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch workers
      .addCase(fetchWorkers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workers = action.payload.workers;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch worker IDs
      .addCase(fetchWorkerIds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkerIds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workerIds = action.payload.workerIds;
      })
      .addCase(fetchWorkerIds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateWorkerHeartbeat, updateWorkerActiveSites } = workerSlice.actions;
export default workerSlice.reducer; 