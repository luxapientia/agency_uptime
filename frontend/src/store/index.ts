import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import siteReducer from './slices/siteSlice';
import notificationReducer from './slices/notificationSlice';
import notificationChannelReducer from './slices/notificationChannelSlice';
import themeReducer from './slices/themeSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'theme'] // Add theme to persisted reducers
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedThemeReducer = persistReducer(persistConfig, themeReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    sites: siteReducer,
    notifications: notificationReducer,
    notificationChannels: notificationChannelReducer,
    theme: persistedThemeReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 