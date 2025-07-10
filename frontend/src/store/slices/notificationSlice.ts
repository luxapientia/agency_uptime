import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import type { Notification } from '../../types/site.types';
import type { RootState } from '../index';

export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
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

export const toggleNotification = createAsyncThunk(
  'notification/toggleNotification',
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

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
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
      state.notifications = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.loading = false;
        state.notifications = action.payload;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add notification
      .addCase(addNotification.fulfilled, (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      })
      // Toggle notification
      .addCase(toggleNotification.fulfilled, (state, action: PayloadAction<Notification>) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      });
  },
});

// Actions
export const { clearError, resetState } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.notifications;
export const selectNotificationsLoading = (state: { notifications: NotificationState }) =>
  state.notifications.loading;
export const selectNotificationsError = (state: { notifications: NotificationState }) =>
  state.notifications.error;

// Reducer
export default notificationSlice.reducer; 