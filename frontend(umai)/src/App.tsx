import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, persistor } from './store';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import SiteDetails from './pages/SiteDetails';
import Settings from './pages/Settings';
import MembershipPlans from './pages/MembershipPlans';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import PublicSiteDetail from './pages/PublicSiteDetail';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { createAppTheme } from './theme';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import type { AppDispatch, RootState } from './store';
import { fetchSettings } from './store/slices/settingSlice';
import { fetchSites } from './store/slices/siteSlice';
import { verifyToken } from './store/slices/authSlice';
import { SocketProvider } from './contexts/SocketContext';
import { SocketEventHandler } from './components/socket/SocketEventHandler';
import { fetchAllSiteStatuses } from './store/slices/siteStatusSlice';
import { fetchAllNotifications } from './store/slices/notificationSlice';
import { fetchWorkers } from './store/slices/workerSlice';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

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
  const themeSettings = useSelector((state: RootState) => state.settings.settings);
  const { user, token, features } = useSelector((state: RootState) => state.auth);
  const theme = createAppTheme(themeSettings);

  // Verify token on startup
  useEffect(() => {
    if (token && !user) {
      dispatch(verifyToken());
    }
  }, [dispatch, token, user]);

  // Update favicon and fetch initial data
  useEffect(() => {
    updateFavicon(themeSettings.favicon);
  }, [themeSettings.favicon]);

  useEffect(() => {
    if (user) {
      dispatch(fetchSettings());
      dispatch(fetchSites());
      dispatch(fetchAllSiteStatuses());
      dispatch(fetchAllNotifications());
      dispatch(fetchWorkers());
    }
  }, [dispatch, user, features]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider autoConnect={!!user}>
        <SocketEventHandler />
        <Router basename={rootUrl}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/sites" element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              } />
              <Route path="/sites/online" element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              } />
              <Route path="/sites/ssl-protected" element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              } />
              <Route path="/sites/with-notifications" element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              } />
              <Route path="/sites/:id" element={
                <ProtectedRoute>
                  <SiteDetails />
                </ProtectedRoute>
              } />
              <Route path="/site-status/:id" element={<PublicSiteDetail />} />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/membership-plans" element={
                <ProtectedRoute>
                  <MembershipPlans />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
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
