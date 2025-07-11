import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, persistor } from './store';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Settings from './pages/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { createAppTheme } from './theme';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import type { AppDispatch, RootState } from './store';
import { fetchThemeSettings } from './store/slices/themeSlice';

// Helper function to update favicon
const updateFavicon = (faviconUrl: string) => {
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

  // If no favicon link exists, create one
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  // Update favicon URL
  link.href = faviconUrl;
};

function AppContent() {
  const rootUrl = import.meta.env.VITE_ROOT_URL;
  const dispatch = useDispatch<AppDispatch>();
  const themeSettings = useSelector((state: RootState) => state.theme.settings);
  const theme = createAppTheme(themeSettings);
  // Update favicon when theme settings change
  useEffect(() => {
    updateFavicon(themeSettings.favicon);
    dispatch(fetchThemeSettings());
  }, [themeSettings.favicon, dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={rootUrl}>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites"
              element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
