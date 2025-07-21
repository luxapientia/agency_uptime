import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import type { NotificationSetting } from '../../types/site.types';
import type { Notification } from '../../types/notification.types';
import type { RootState } from '../../store';

export interface NotificationState {
  notificationSettings: NotificationSetting[];
  notifications: Notification[];
  loading: {
    settings: boolean;
    notifications: boolean;
  };
  error: string | null;
}

const initialState: NotificationState = {
  notificationSettings: [],
  notifications: [],
  loading: {
    settings: false,
    notifications: false
  },
  error: null,
};

// Fetch all notifications
export const fetchAllNotifications = createAsyncThunk(
  'notification/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/notifications');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

// Mark notifications as seen
export const markNotificationsAsSeen = createAsyncThunk(
  'notification/markAsSeen',
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      await axios.post('/notifications/seen', {
        notificationIds
      });
      return notificationIds;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notifications as seen'
      );
    }
  }
);

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

export const addNotificationSetting = createAsyncThunk(
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
      state.notifications = [];
      state.loading = {
        settings: false,
        notifications: false
      };
      state.error = null;
    },
    receiveNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload); // Add new notification at the beginning
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all notifications
      .addCase(fetchAllNotifications.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.loading.notifications = false;
        state.notifications = action.payload;
        state.error = null;
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload as string;
      })
      // Mark notifications as seen
      .addCase(markNotificationsAsSeen.fulfilled, (state, action: PayloadAction<string[]>) => {
        const seenIds = new Set(action.payload);
        state.notifications = state.notifications.map(notification => 
          seenIds.has(notification.id) ? { ...notification, seen: true } : notification
        );
      })
      // Notification settings cases
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading.settings = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action: PayloadAction<NotificationSetting[]>) => {
        state.loading.settings = false;
        state.notificationSettings = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.payload as string;
      })
      .addCase(addNotificationSetting.fulfilled, (state, action: PayloadAction<NotificationSetting>) => {
        state.notificationSettings.push(action.payload);
      })
      .addCase(toggleNotificationSetting.fulfilled, (state, action: PayloadAction<NotificationSetting>) => {
        const index = state.notificationSettings.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notificationSettings[index] = action.payload;
        }
      })
      .addCase(deleteNotificationSetting.fulfilled, (state, action: PayloadAction<string>) => {
        state.notificationSettings = state.notificationSettings.filter(n => n.id !== action.payload);
      });
  },
});

// Actions
export const { clearError, resetState, receiveNotification } = notificationSlice.actions;

// Base selectors
const selectNotificationsState = (state: RootState) => state.notifications;

// Memoized selectors
export const selectNotificationSettings = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notificationSettings
);

export const selectAllNotifications = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notifications
);

export const selectUnseenNotifications = createSelector(
  [selectAllNotifications],
  (notifications) => notifications.filter(notification => !notification.seen)
);

export const selectNotificationLoading = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.loading
);

export const selectNotificationError = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.error
);

// Reducer
export default notificationSlice.reducer; 