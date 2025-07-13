import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import type { NotificationSetting } from '../../types/site.types';

export interface NotificationState {
  notificationSettings: NotificationSetting[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notificationSettings: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotificationSettings = createAsyncThunk(
  'notification/fetchNotificationSettings',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/sites/${siteId}/notifications`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch notifications'
      );
    }
  }
);

export const addNotification = createAsyncThunk(
  'notification/addNotification',
  async ({ siteId, type, contactInfo }: { siteId: string; type: string; contactInfo: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/sites/${siteId}/notifications`, {
        type,
        contactInfo,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to add notification'
      );
    }
  }
);

export const toggleNotificationSetting = createAsyncThunk(
  'notification/toggleNotificationSetting',
  async ({ siteId, notificationId, enabled }: { siteId: string; notificationId: string; enabled: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/sites/${siteId}/notifications/${notificationId}`, {
        enabled,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to toggle notification'
      );
    }
  }
);

export const deleteNotificationSetting = createAsyncThunk(
  'notification/deleteNotificationSetting',
  async ({ siteId, notificationId }: { siteId: string; notificationId: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`/sites/${siteId}/notifications/${notificationId}`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete notification'
      );
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      state.notificationSettings = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action: PayloadAction<NotificationSetting[]>) => {
        state.loading = false;
        state.notificationSettings = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add notification
      .addCase(addNotification.fulfilled, (state, action: PayloadAction<NotificationSetting>) => {
        state.notificationSettings.push(action.payload);
      })
      // Toggle notification
      .addCase(toggleNotificationSetting.fulfilled, (state, action: PayloadAction<NotificationSetting>) => {
        const index = state.notificationSettings.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notificationSettings[index] = action.payload;
        }
      })
      // Delete notification
      .addCase(deleteNotificationSetting.fulfilled, (state, action: PayloadAction<string>) => {
        state.notificationSettings = state.notificationSettings.filter(n => n.id !== action.payload);
      });
  },
});

// Actions
export const { clearError, resetState } = notificationSlice.actions;

// Selectors
export const selectNotificationSettings = (state: { notificationSettings: NotificationState }) =>
  state.notificationSettings.notificationSettings;
export const selectNotificationSettingsLoading = (state: { notificationSettings: NotificationState }) =>
  state.notificationSettings.loading;
export const selectNotificationSettingsError = (state: { notificationSettings: NotificationState }) =>
  state.notificationSettings.error;

// Reducer
export default notificationSlice.reducer; 