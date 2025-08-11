import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ArrowBack,
  Security,
  Speed,
  Timeline,
  Language,
  Storage,
} from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';
import type { PublicSite } from '../types/site.types';
import axios from '../lib/axios';

const PublicSiteDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<PublicSite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get agency theme colors and settings
  const agencyTheme = site?.user?.themeSettings;
  const primaryColor = agencyTheme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = agencyTheme?.secondaryColor || theme.palette.secondary.main;
  const textPrimary = agencyTheme?.textPrimary || theme.palette.text.primary;
  const textSecondary = agencyTheme?.textSecondary || theme.palette.text.secondary;

  useEffect(() => {
    const fetchSiteDetail = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch the specific site details from the new API endpoint
        const response = await axios.get(`/all-sites/${id}`);
        setSite(response.data.site);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Site not found');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch site details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteDetail();
  }, [id]);

  const getStatusChip = (isUp: boolean) => {
    if (isUp) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Online"
          sx={{
            color: primaryColor,
            borderColor: primaryColor,
            '& .MuiChip-icon': {
              color: primaryColor,
            }
          }}
          size="medium"
          variant="outlined"
        />
      );
    } else {
      return (
        <Chip
          icon={<Cancel />}
          label="Offline"
          sx={{
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            '& .MuiChip-icon': {
              color: theme.palette.error.main,
            }
          }}
          size="medium"
          variant="outlined"
        />
      );
    }
  };

  const getLastChecked = () => {
    if (!site?.statuses?.[0]?.checkedAt) return 'Never';
    
    const date = new Date(site.statuses[0].checkedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </Box>
        <Footer variant="public" />
      </Layout>
    );
  }

  if (error || !site) {
    return (
      <Layout>
        <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
          <Container maxWidth="lg">
            <Alert severity="error" sx={{ fontSize: '1.1rem' }}>
              {error || 'Site not found'}
            </Alert>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/sites-status')}
                startIcon={<ArrowBack />}
              >
                Back to Sites
              </Button>
            </Box>
          </Container>
        </Box>
        <Footer variant="public" />
      </Layout>
    );
  }

  const status = site.statuses[0];
  const isUp = status?.isUp || false;

  return (
    <Layout>
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <IconButton
                onClick={() => navigate('/sites-status')}
                sx={{ color: primaryColor }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimary }}>
                Site Status Details
              </Typography>
            </Box>
            
            {/* Site Info Card */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                {site.user.themeSettings?.logo ? (
                  <Box
                    component="img"
                    src={`${import.meta.env.VITE_API_URL}/${site.user.themeSettings.logo}`}
                    alt={site.user.companyName}
                    sx={{
                      width: 64,
                      height: 64,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: `2px solid ${primaryColor}20`
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: primaryColor,
                      color: theme.palette.primary.contrastText,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600
                    }}
                  >
                    {site.user.companyName.charAt(0).toUpperCase()}
                  </Box>
                )}
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {site.name}
                  </Typography>
                  <Typography variant="h6" sx={{ color: textSecondary, mb: 1 }}>
                    {site.user.companyName}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: primaryColor,
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}
                  >
                    {site.url}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'right' }}>
                  {getStatusChip(isUp)}
                  <Typography variant="body2" sx={{ color: textSecondary, mt: 1 }}>
                    Last checked: {getLastChecked()}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Status Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* First Row */}
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Overall Status */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Timeline sx={{ color: primaryColor }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                        Overall Status
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>Site Status:</Typography>
                        {getStatusChip(isUp)}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>HTTP Status:</Typography>
                        {getStatusChip(status?.httpIsUp || false)}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>Ping Status:</Typography>
                        {getStatusChip(status?.pingIsUp || false)}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>DNS Status:</Typography>
                        {getStatusChip(status?.dnsIsUp || false)}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Response Times */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Speed sx={{ color: secondaryColor }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                        Response Times
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>HTTP Response:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                          {status?.httpResponseTime ? `${status.httpResponseTime.toFixed(2)}ms` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>Ping Response:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                          {status?.pingResponseTime ? `${status.pingResponseTime.toFixed(2)}ms` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>DNS Response:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                          {status?.dnsResponseTime ? `${status.dnsResponseTime.toFixed(2)}ms` : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Second Row */}
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* SSL Information */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Security sx={{ color: theme.palette.success.main }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                        SSL Certificate
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>SSL Status:</Typography>
                        {status?.hasSsl ? (
                          <Chip label="Valid" color="success" size="small" />
                        ) : (
                          <Chip label="Invalid" color="error" size="small" />
                        )}
                      </Box>
                      {status?.sslDaysUntilExpiry !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: textSecondary }}>Days Until Expiry:</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              color: status.sslDaysUntilExpiry <= 30 ? theme.palette.warning.main : theme.palette.success.main
                            }}
                          >
                            {status.sslDaysUntilExpiry} days
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Site Information */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Storage sx={{ color: secondaryColor }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                        Site Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>Created:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                          {formatDate(site.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>Last Updated:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimary }}>
                          {formatDate(site.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/sites-status')}
                startIcon={<ArrowBack />}
                sx={{ 
                  mr: 2,
                  color: primaryColor,
                  borderColor: primaryColor,
                  '&:hover': {
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}10`
                  }
                }}
              >
                Back to Sites
              </Button>
              <Button
                variant="contained"
                onClick={() => window.open(site.url, '_blank')}
                startIcon={<Language />}
                sx={{
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryColor,
                    opacity: 0.9
                  }
                }}
              >
                Visit Site
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default PublicSiteDetail; 