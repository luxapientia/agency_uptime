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
  Button,
  IconButton,
  LinearProgress,
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
  Warning,
  Info,
  TrendingUp,
  Support,
  Visibility,
  Assessment,
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return theme.palette.success.main;
      case 'degraded': return theme.palette.warning.main;
      case 'outage': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle />;
      case 'degraded': return <Warning />;
      case 'outage': return <Cancel />;
      default: return <Info />;
    }
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

  const overallStatus = site.status.overall;
  const statusMessage = site.status.message;
  const currentResponseTime = site.status.currentResponseTime;
  const uptime24h = site.status.uptime['24h'];
  const uptime7d = site.status.uptime['7d'];
  const uptime30d = site.status.uptime['30d'];

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
                <Box
                  component="img"
                  src={`${import.meta.env.VITE_API_URL}/${site.user.themeSettings?.logo || 'logo.png'}`}
                  alt={site.user.companyName}
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: `2px solid ${primaryColor}20`
                  }}
                />
                
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
              </Box>
            </Paper>

            {/* Status Banner - Current Operational Status at a Glance */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 3, 
                mb: 4,
                background: `linear-gradient(135deg, ${getStatusColor(overallStatus)}15, ${getStatusColor(overallStatus)}05)`,
                border: `2px solid ${getStatusColor(overallStatus)}30`
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {getStatusIcon(overallStatus)}
                </Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: getStatusColor(overallStatus),
                    mb: 1
                  }}
                >
                  {statusMessage}
                </Typography>
                <Typography variant="h6" sx={{ color: textSecondary, mb: 2 }}>
                  Last checked: {site.status.lastChecked ? formatTimestamp(site.status.lastChecked) : 'Never'}
                </Typography>
                
                {/* Current Response Time */}
                {currentResponseTime && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'white', borderRadius: 2 }}>
                    <Speed sx={{ color: primaryColor }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Current Response Time: {currentResponseTime.toFixed(0)}ms
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Uptime Metrics - Performance Indicators */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: textPrimary, mb: 2 }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Uptime Performance
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* 24 Hour Uptime */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: primaryColor, mb: 1 }}>
                      {uptime24h.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      24 Hour Uptime
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={uptime24h}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: primaryColor,
                        }
                      }}
                    />
                  </Box>
                </Card>

                {/* 7 Day Uptime */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: secondaryColor, mb: 1 }}>
                      {uptime7d.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      7 Day Uptime
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={uptime7d}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: secondaryColor,
                        }
                      }}
                    />
                  </Box>
                </Card>

                {/* 30 Day Uptime */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                      {uptime30d.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      30 Day Uptime
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={uptime30d}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: theme.palette.success.main,
                        }
                      }}
                    />
                  </Box>
                </Card>
              </Box>
            </Box>

            {/* AI Diagnostics Section */}
            {site.aiDiagnostics && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Assessment sx={{ color: primaryColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    AI Diagnostic Analysis
                  </Typography>
                  <Chip 
                    label={`${site.aiDiagnostics.confidence}% Confidence`}
                    color="info"
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Diagnosis
                    </Typography>
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500 }}>
                      {site.aiDiagnostics.diagnosis}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Severity
                    </Typography>
                    <Chip 
                      label={site.aiDiagnostics.severity}
                      color={site.aiDiagnostics.severity === 'high' ? 'error' : site.aiDiagnostics.severity === 'medium' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Recommendations
                    </Typography>
                    <Typography variant="body1" sx={{ color: textPrimary }}>
                      {site.aiDiagnostics.recommendations}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* AI Predictive Analysis Section */}
            {site.aiPredictiveAnalysis && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TrendingUp sx={{ color: secondaryColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    AI Predictive Analysis
                  </Typography>
                  <Chip 
                    label={`${site.aiPredictiveAnalysis.confidence}% Confidence`}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={`Next ${site.aiPredictiveAnalysis.timeframe}`}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Predicted Status */}
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: `${secondaryColor}10`, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Predicted Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                      {site.aiPredictiveAnalysis.predictedStatus === 'up' ? (
                        <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 32 }} />
                      ) : site.aiPredictiveAnalysis.predictedStatus === 'degraded' ? (
                        <Warning sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
                      ) : (
                        <Cancel sx={{ color: theme.palette.error.main, fontSize: 32 }} />
                      )}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          color: site.aiPredictiveAnalysis.predictedStatus === 'up' 
                            ? theme.palette.success.main 
                            : site.aiPredictiveAnalysis.predictedStatus === 'degraded'
                            ? theme.palette.warning.main
                            : theme.palette.error.main
                        }}
                      >
                        {site.aiPredictiveAnalysis.predictedStatus === 'up' ? 'Operational' : 
                         site.aiPredictiveAnalysis.predictedStatus === 'degraded' ? 'Degraded' : 'Outage'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      Predicted for the next {site.aiPredictiveAnalysis.timeframe}
                    </Typography>
                  </Box>

                  {/* Risk Factors */}
                  {site.aiPredictiveAnalysis.riskFactors && site.aiPredictiveAnalysis.riskFactors.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: textSecondary, mb: 2, fontWeight: 600 }}>
                        Identified Risk Factors
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {site.aiPredictiveAnalysis.riskFactors.map((risk, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Warning sx={{ color: theme.palette.warning.main, fontSize: 16, mt: 0.5, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: textPrimary }}>
                              {risk}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Recommendations */}
                  {site.aiPredictiveAnalysis.recommendations && site.aiPredictiveAnalysis.recommendations.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: textSecondary, mb: 2, fontWeight: 600 }}>
                        AI Recommendations
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {site.aiPredictiveAnalysis.recommendations.map((recommendation, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 16, mt: 0.5, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: textPrimary }}>
                              {recommendation}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Analysis Timestamp */}
                  <Box sx={{ textAlign: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      Analysis generated: {formatTimestamp(site.aiPredictiveAnalysis.predictedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Recent Incidents Section */}
            {site.incidents.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Warning sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    Recent Incidents
                  </Typography>
                  <Chip 
                    label={`${site.incidents.length} incidents`}
                    color="warning"
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {site.incidents.slice(0, 5).map((incident, index) => (
                    <Box key={index} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: textSecondary }}>
                          {formatTimestamp(incident.start)}
                        </Typography>
                        <Chip 
                          label={incident.end ? 'Resolved' : 'Ongoing'}
                          color={incident.end ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500, mb: 1 }}>
                        {incident.cause}
                      </Typography>
                      
                      {incident.resolution && (
                        <Typography variant="body2" sx={{ color: textSecondary }}>
                          Resolution: {incident.resolution}
                        </Typography>
                      )}
                      
                      {incident.duration && (
                        <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                          Duration: {Math.round(incident.duration / 60000)} minutes
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Detailed Status Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: textPrimary, mb: 2 }}>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Service Status Details
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* HTTP Status */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {site.detailedStatus.http.isUp ? (
                        <CheckCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />
                      ) : (
                        <Cancel sx={{ fontSize: 32, color: theme.palette.error.main }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary, mb: 1 }}>
                      HTTP Service
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      {site.detailedStatus.http.isUp ? 'Online' : 'Offline'}
                    </Typography>
                    {site.detailedStatus.http.responseTime && (
                      <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor }}>
                        {site.detailedStatus.http.responseTime.toFixed(0)}ms
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Ping Status */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {site.detailedStatus.ping.isUp ? (
                        <CheckCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />
                      ) : (
                        <Cancel sx={{ fontSize: 32, color: theme.palette.error.main }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary, mb: 1 }}>
                      Ping Service
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      {site.detailedStatus.ping.isUp ? 'Online' : 'Offline'}
                    </Typography>
                    {site.detailedStatus.ping.responseTime && (
                      <Typography variant="h6" sx={{ fontWeight: 700, color: secondaryColor }}>
                        {site.detailedStatus.ping.responseTime.toFixed(0)}ms
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* DNS Status */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {site.detailedStatus.dns.isUp ? (
                        <CheckCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />
                      ) : (
                        <Cancel sx={{ fontSize: 32, color: theme.palette.error.main }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary, mb: 1 }}>
                      DNS Service
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      {site.detailedStatus.dns.isUp ? 'Online' : 'Offline'}
                    </Typography>
                    {site.detailedStatus.dns.responseTime && (
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                        {site.detailedStatus.dns.responseTime.toFixed(0)}ms
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Box>
            </Box>

            {/* SSL Certificate Information */}
            {site.detailedStatus.ssl.hasSsl && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Security sx={{ color: primaryColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    SSL Certificate Status
                  </Typography>
                  <Chip 
                    label={site.detailedStatus.ssl.daysUntilExpiry && site.detailedStatus.ssl.daysUntilExpiry > 30 ? 'Valid' : 'Expiring Soon'}
                    color={site.detailedStatus.ssl.daysUntilExpiry && site.detailedStatus.ssl.daysUntilExpiry > 30 ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Days Until Expiry
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary }}>
                      {site.detailedStatus.ssl.daysUntilExpiry || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Valid From
                    </Typography>
                    <Typography variant="body1" sx={{ color: textPrimary }}>
                      {site.detailedStatus.ssl.validFrom ? formatTimestamp(site.detailedStatus.ssl.validFrom) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Valid Until
                    </Typography>
                    <Typography variant="body1" sx={{ color: textPrimary }}>
                      {site.detailedStatus.ssl.validTo ? formatTimestamp(site.detailedStatus.ssl.validTo) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                      Issuer
                    </Typography>
                    <Typography variant="body1" sx={{ color: textPrimary, wordBreak: 'break-word' }}>
                      {site.detailedStatus.ssl.issuer || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* DNS Information */}
            {site.detailedStatus.dns.nameservers.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Storage sx={{ color: secondaryColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    DNS Configuration
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                      Nameservers
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {site.detailedStatus.dns.nameservers.map((ns, index) => (
                        <Chip
                          key={index}
                          label={ns}
                          size="small"
                          variant="outlined"
                          sx={{ alignSelf: 'flex-start' }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  {site.detailedStatus.dns.records && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                        DNS Records
                      </Typography>
                      <Typography variant="body2" sx={{ color: textPrimary, fontFamily: 'monospace' }}>
                        {JSON.stringify(site.detailedStatus.dns.records, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            {/* TCP Port Information */}
            {site.detailedStatus.tcp.checks && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Language sx={{ color: theme.palette.info.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary }}>
                    TCP Port Status
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.isArray(site.detailedStatus.tcp.checks) && site.detailedStatus.tcp.checks.map((check: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {check.isUp ? (
                          <CheckCircle sx={{ color: theme.palette.success.main }} />
                        ) : (
                          <Cancel sx={{ color: theme.palette.error.main }} />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Port {check.port}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: textSecondary }}>
                        {check.isUp ? 'Open' : 'Closed'}
                      </Typography>
                      
                      {check.responseTime && (
                        <Typography variant="body2" sx={{ color: primaryColor }}>
                          {check.responseTime.toFixed(0)}ms
                        </Typography>
                      )}
                      
                      {check.error && (
                        <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                          Error: {check.error}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Reassurance & Support */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4, bgcolor: `${primaryColor}05` }}>
              <Box sx={{ textAlign: 'center' }}>
                <Support sx={{ fontSize: 48, color: primaryColor, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: textPrimary, mb: 2 }}>
                  We monitor this site 24/7 and respond instantly to outages
                </Typography>
                <Typography variant="body1" sx={{ color: textSecondary, mb: 3 }}>
                  If you experience ongoing issues, please contact our support team
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={() => window.open(site.url, '_blank')}
                  sx={{
                    backgroundColor: primaryColor,
                    '&:hover': { backgroundColor: primaryColor, opacity: 0.9 }
                  }}
                >
                  Visit Site
                </Button>
              </Box>
            </Paper>

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
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default PublicSiteDetail; 