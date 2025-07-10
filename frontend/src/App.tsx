import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, persistor } from './store';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Sites from './pages/dashboard/Sites';
import Settings from './pages/dashboard/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { createAppTheme } from './theme';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

function AppContent() {
  const rootUrl = import.meta.env.VITE_ROOT_URL;
  const themeSettings = useSelector((state: RootState) => state.theme.settings);
  const theme = createAppTheme(themeSettings);

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
              path="/dashboard/sites"
              element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
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
