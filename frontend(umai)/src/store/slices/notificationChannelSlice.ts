import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';

// Types
interface ChannelInstructions {
  instructions: string[];
}

interface TelegramChannel extends ChannelInstructions {
  botUsername: string;
}

interface SlackChannel extends ChannelInstructions {
  inviteLink: string;
}

interface DiscordChannel extends ChannelInstructions {
  inviteLink: string;
}

interface EmailChannel extends ChannelInstructions {}

export interface NotificationChannels {
  telegram: TelegramChannel;
  slack: SlackChannel;
  discord: DiscordChannel;
  email: EmailChannel;
}

export interface NotificationChannelState {
  channels: NotificationChannels | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: NotificationChannelState = {
  channels: null,
  loading: false,
  error: null,
};

// Async thunk for fetching notification channels
export const fetchNotificationChannels = createAsyncThunk(
  'notificationChannel/fetchChannels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/sites/notification-channels');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch notification channels'
      );
    }
  }
);

// Slice
const notificationChannelSlice = createSlice({
  name: 'notificationChannel',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      state.channels = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchNotificationChannels.fulfilled,
        (state, action: PayloadAction<NotificationChannels>) => {
          state.loading = false;
          state.channels = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchNotificationChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearError, resetState } = notificationChannelSlice.actions;

// Selectors
export const selectNotificationChannels = (state: { notificationChannels: NotificationChannelState }) =>
  state.notificationChannels.channels;
export const selectNotificationChannelsLoading = (state: { notificationChannels: NotificationChannelState }) =>
  state.notificationChannels.loading;
export const selectNotificationChannelsError = (state: { notificationChannels: NotificationChannelState }) =>
  state.notificationChannels.error;

// Reducer
export default notificationChannelSlice.reducer;
