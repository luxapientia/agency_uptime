import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import type { AuthState } from '../types/auth.types';
import type { SiteState } from '../types/site.types';
import authReducer from './slices/authSlice';
import siteReducer from './slices/siteSlice';
import notificationChannelReducer from './slices/notificationChannelSlice';
import notificationReducer from './slices/notificationSlice';
import type { NotificationChannelState } from './slices/notificationChannelSlice';
import type { NotificationState } from './slices/notificationSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user'],
};

const rootReducer = combineReducers({
  auth: persistReducer<AuthState>(authPersistConfig, authReducer),
  sites: siteReducer,
  notificationChannel: notificationChannelReducer,
  notification: notificationReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = {
  auth: AuthState;
  sites: SiteState;
  notificationChannel: NotificationChannelState;
  notification: NotificationState;
};
export type AppDispatch = typeof store.dispatch; 