import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import siteReducer from './slices/siteSlice';
import notificationReducer from './slices/notificationSlice';
import notificationChannelReducer from './slices/notificationChannelSlice';
import settingsReducer from './slices/settingSlice';
import siteStatusReducer from './slices/siteStatusSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'settings']
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedSettingsReducer = persistReducer(persistConfig, settingsReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    sites: siteReducer,
    notifications: notificationReducer,
    notificationChannels: notificationChannelReducer,
    settings: persistedSettingsReducer,
    siteStatus: siteStatusReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 