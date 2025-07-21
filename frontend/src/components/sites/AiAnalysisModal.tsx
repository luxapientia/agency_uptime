import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
  Alert,
  Card,
  Chip,
  Tabs,
  Tab,
  useTheme,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Psychology as AiIcon,
  Close as CloseIcon,
  Assessment as AnalysisIcon,
  Timeline as PredictiveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  Shield as ShieldIcon,
  Schedule as ScheduleIcon,
  Lightbulb as InsightIcon,
  Recommend as RecommendIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import axios from '../../lib/axios';

interface AiAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Types matching the KimiPredictiveService interfaces
interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  cacheHits?: number;
}

// interface UpcomingRisk {
//   risk: string;
//   probability: number;
//   timeframe: string;
//   mitigation: string;
// }

// interface PredictiveSummary {
//   period: string;
//   overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
//   keyInsights: string[];
//   upcomingRisks: UpcomingRisk[];
//   recommendations: string[];
//   tokenUsage: TokenUsage;
// }

interface DiagnosticResult {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  overallHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceAnalysis?: {
    responseTimeIssues?: string;
    uptimeIssues?: string;
    regionalIssues?: string;
  };
  securityAnalysis?: {
    sslIssues?: string;
    dnsIssues?: string;
    tcpIssues?: string;
  };
  recommendations: string[];
  perWorkerRecommendations?: Array<{
    workerId: string;
    issues: string[];
    recommendations: string[];
  }>;
  predictedIssues?: string[];
  confidence: number;
  anomalies?: string[];
  tokenUsage: TokenUsage;
}

interface StatusPrediction {
  predictedStatus: 'up' | 'down' | 'degraded';
  confidence: number;
  timeframe: string;
  reasoning: string;
  performancePrediction?: {
    responseTime?: string;
    uptime?: string;
    reliability?: string;
  };
  riskFactors?: string[];
  recommendations: string[];
  perWorkerPredictions?: Array<{
    workerId: string;
    predictedStatus: 'up' | 'down' | 'degraded';
    confidence: number;
    reasoning: string;
  }>;
  failureAnalysis?: string[];
  timeBasedRisks?: string[];
  infrastructureRisks?: string[];
  tokenUsage: TokenUsage;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AiAnalysisModal({ open, onClose, siteId, siteName }: AiAnalysisModalProps) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isPredictiveLoading, setIsPredictiveLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<{ analysis: DiagnosticResult; siteId: string; siteName: string; analyzedAt: string } | null>(null);
  const [predictiveData, setPredictiveData] = useState<{ prediction: StatusPrediction; siteId: string; siteName: string; timeframe: string; predictedAt: string } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [predictiveError, setPredictiveError] = useState<string | null>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTabValue(0);
      setAnalysisData(null);
      setPredictiveData(null);
      setAnalysisError(null);
      setPredictiveError(null);
      setShowTokenDetails(false);
    }
  }, [open]);

  // Auto-fetch analysis when modal opens
  useEffect(() => {
    if (open && !analysisData && !isAnalysisLoading) {
      fetchAnalysis();
    }
  }, [open, siteId]);

  const fetchAnalysis = async () => {
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      const response = await axios.post('/ai/analyze-site', {
        siteId: siteId
      });
      
      if (response.data.success) {
        setAnalysisData(response.data.data);
      } else {
        setAnalysisError('Failed to analyze site');
      }
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      setAnalysisError(error.response?.data?.error || 'AI analysis failed');
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const fetchPredictiveSummary = async () => {
    setIsPredictiveLoading(true);
    setPredictiveError(null);
    
    try {
      const response = await axios.post('/ai/predict-site', {
        siteId: siteId,
        timeframe: '24h'
      });
      
      if (response.data.success) {
        console.log(response.data.data)
        setPredictiveData(response.data.data);
      } else {
        setPredictiveError('Failed to generate predictive summary');
      }
    } catch (error: any) {
      console.error('Predictive summary failed:', error);
      setPredictiveError(error.response?.data?.error || 'Predictive summary failed');
    } finally {
      setIsPredictiveLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setTabValue(newValue);
    
    // Auto-fetch predictive data when switching to predictive tab
    if (newValue === 1 && !predictiveData && !isPredictiveLoading) {
      fetchPredictiveSummary();
    } else if (newValue === 0 && !analysisData && !isAnalysisLoading) {
      fetchAnalysis();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'high': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return <CheckCircleIcon />;
      case 'medium': return <WarningIcon />;
      case 'high': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 3,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
          : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
        color: 'white'
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <AiIcon sx={{ fontSize: 32 }} />
          <Stack spacing={0}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              AI Health Analysis
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {siteName}
            </Typography>
          </Stack>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: '#ffffff',
            '&:hover': { backgroundColor: alpha('#ffffff', 0.1) }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ px: 3 }}
        >
          <Tab
            icon={<AnalysisIcon />}
            label="Health Analysis"
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            icon={<PredictiveIcon />}
            label="Predictive Insights"
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, minHeight: 450 }}>
        {/* Information Banner */}
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.info.main, 0.05), 
          borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Monitoring System:</strong> Your site is monitored from multiple regions worldwide.
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.secondary.main
                }} />
                <Typography variant="caption" color="text.secondary">
                  Regional monitoring
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main
                }} />
                <Typography variant="caption" color="text.secondary">
                  Combined analysis
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Site Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            {isAnalysisLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing site health with AI...
                </Typography>
              </Box>
            ) : analysisError ? (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={fetchAnalysis}>
                    Retry
                  </Button>
                }
              >
                {analysisError}
              </Alert>
            ) : analysisData ? (
              <Stack spacing={3}>
                {/* Analysis Header */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AnalysisIcon color="primary" sx={{ fontSize: 24 }} />
                  </Box>
                  <Stack>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Health Analysis Results
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(analysisData.analyzedAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                {/* Diagnosis */}
                {analysisData.analysis?.diagnosis && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.info.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.info.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AnalysisIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="info.main">
                          AI Diagnosis
                        </Typography>
                      </Stack>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {analysisData.analysis.diagnosis}
                      </Typography>
                    </Stack>
                  </Card>
                )}

                {/* Severity & Confidence */}
                {analysisData.analysis?.severity && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(getSeverityColor(analysisData.analysis.severity), 0.05), 
                    border: `1px solid ${alpha(getSeverityColor(analysisData.analysis.severity), 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(getSeverityColor(analysisData.analysis.severity), 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <WarningIcon sx={{ color: getSeverityColor(analysisData.analysis.severity), fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: getSeverityColor(analysisData.analysis.severity) }}>
                          Risk Assessment
                        </Typography>
                      </Stack>
                      
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body1" fontWeight={600} color="text.primary">
                            Severity Level:
                          </Typography>
                          <Chip
                            icon={getSeverityIcon(analysisData.analysis.severity)}
                            label={analysisData.analysis.severity.toUpperCase()}
                            sx={{
                              backgroundColor: getSeverityColor(analysisData.analysis.severity),
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}
                          />
                        </Stack>
                        
                        {analysisData.analysis.confidence && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TrendingUpIcon color="primary" sx={{ fontSize: 20 }} />
                            <Typography variant="body1" fontWeight={600} color="primary">
                              {Math.round(analysisData.analysis.confidence * 100)}% Confidence
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Recommendations */}
                {analysisData.analysis?.recommendations && analysisData.analysis.recommendations.length > 0 && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.success.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.success.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <RecommendIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="success.main">
                          AI Recommendations
                        </Typography>
                      </Stack>
                      
                      <Stack spacing={2}>
                        {analysisData.analysis.recommendations.map((rec: string, index: number) => (
                          <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{
                              p: 0.5,
                              borderRadius: '50%',
                              backgroundColor: alpha(theme.palette.success.main, 0.2),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 24,
                              height: 24,
                              mt: 0.25
                            }}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                              {rec}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Overall Health Status */}
                {analysisData.analysis?.overallHealth && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.info.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.info.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TrendingUpIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                        </Box>
                        <Stack>
                          <Typography variant="subtitle1" fontWeight={600} color="info.main">
                            Overall Health Status
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Combined analysis from all monitoring regions
                          </Typography>
                        </Stack>
                      </Stack>
                      
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body1" fontWeight={600} color="text.primary">
                          Health Level:
                        </Typography>
                        <Chip
                          label={analysisData.analysis.overallHealth.toUpperCase()}
                          sx={{
                            backgroundColor: 
                              analysisData.analysis.overallHealth === 'excellent' ? theme.palette.success.main :
                              analysisData.analysis.overallHealth === 'good' ? theme.palette.info.main :
                              analysisData.analysis.overallHealth === 'fair' ? theme.palette.warning.main :
                              analysisData.analysis.overallHealth === 'poor' ? theme.palette.error.main :
                              theme.palette.grey[500],
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Performance Analysis */}
                {analysisData.analysis?.performanceAnalysis && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                          Performance Analysis
                        </Typography>
                      </Stack>
                      
                      <Stack spacing={3}>
                        {analysisData.analysis.performanceAnalysis.responseTimeIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              Response Time Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.performanceAnalysis.responseTimeIssues}
                            </Typography>
                          </Box>
                        )}
                        
                        {analysisData.analysis.performanceAnalysis.uptimeIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              Uptime Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.performanceAnalysis.uptimeIssues}
                            </Typography>
                          </Box>
                        )}
                        
                        {analysisData.analysis.performanceAnalysis.regionalIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              Regional Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.performanceAnalysis.regionalIssues}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Security Analysis */}
                {analysisData.analysis?.securityAnalysis && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.warning.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.warning.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ShieldIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                          Security Analysis
                        </Typography>
                      </Stack>
                      
                      <Stack spacing={3}>
                        {analysisData.analysis.securityAnalysis.sslIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              SSL Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.securityAnalysis.sslIssues}
                            </Typography>
                          </Box>
                        )}
                        
                        {analysisData.analysis.securityAnalysis.dnsIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              DNS Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.securityAnalysis.dnsIssues}
                            </Typography>
                          </Box>
                        )}
                        
                        {analysisData.analysis.securityAnalysis.tcpIssues && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                              TCP Issues:
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {analysisData.analysis.securityAnalysis.tcpIssues}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Anomalies */}
                {analysisData.analysis?.anomalies && analysisData.analysis.anomalies.length > 0 && (
                  <Card sx={{ 
                    p: 3, 
                    bgcolor: alpha(theme.palette.error.main, 0.05), 
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.error.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="error.main">
                          Detected Anomalies
                        </Typography>
                      </Stack>
                      
                      <Stack spacing={2}>
                        {analysisData.analysis.anomalies.map((anomaly: string, index: number) => (
                          <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{
                              p: 0.5,
                              borderRadius: '50%',
                              backgroundColor: alpha(theme.palette.error.main, 0.2),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 24,
                              height: 24,
                              mt: 0.25
                            }}>
                              <WarningIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                              {anomaly}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                )}

                {/* Predicted Issues */}
                {analysisData.analysis?.predictedIssues && analysisData.analysis.predictedIssues.length > 0 && (
                  <Card sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      Potential Future Issues
                    </Typography>
                    <Stack spacing={2}>
                      {analysisData.analysis.predictedIssues.map((issue: string, index: number) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 18, mt: 0.25 }} />
                          <Typography variant="body1">{issue}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Token Usage */}
                {analysisData.analysis?.tokenUsage && (
                  <Box>
                    <Button
                      onClick={() => setShowTokenDetails(!showTokenDetails)}
                      startIcon={showTokenDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      variant="text"
                      size="small"
                      sx={{ mb: 1 }}
                    >
                      Token Usage Details
                    </Button>
                    <Collapse in={showTokenDetails}>
                      <Card sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                        <Stack direction="row" spacing={3} flexWrap="wrap">
                          <Typography variant="body2" color="text.secondary">
                            Total: {analysisData.analysis.tokenUsage.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Input: {analysisData.analysis.tokenUsage.prompt}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Output: {analysisData.analysis.tokenUsage.completion}
                          </Typography>
                        </Stack>
                      </Card>
                    </Collapse>
                  </Box>
                )}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No analysis data available
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Predictive Summary Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            {isPredictiveLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating predictive summary...
                </Typography>
              </Box>
            ) : predictiveError ? (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={fetchPredictiveSummary}>
                    Retry
                  </Button>
                }
              >
                {predictiveError}
              </Alert>
            ) : predictiveData ? (
              <Stack spacing={3}>
                {/* Summary Header */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PredictiveIcon color="primary" sx={{ fontSize: 24 }} />
                  </Box>
                  <Stack>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Predictive Analysis
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(predictiveData.predictedAt).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {predictiveData.timeframe}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>

                {/* Summary Content */}
                {predictiveData.prediction && (
                  <Stack spacing={3}>
                    {/* Overall Health Status */}
                    <Card sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PredictiveIcon color="primary" />
                        AI Predictive Analysis - {predictiveData.timeframe}
                      </Typography>
                      
                      {/* Handle different prediction formats */}
                      {typeof predictiveData.prediction === 'string' ? (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {predictiveData.prediction}
                        </Typography>
                      ) : predictiveData.prediction && typeof predictiveData.prediction === 'object' ? (
                        <Stack spacing={3}>
                          {/* Predicted Status */}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                              Predicted Status:
                          </Typography>
                          <Chip
                              label={predictiveData.prediction.predictedStatus.toUpperCase()}
                            sx={{
                              backgroundColor: 
                                  predictiveData.prediction.predictedStatus === 'up' ? theme.palette.success.main :
                                  predictiveData.prediction.predictedStatus === 'degraded' ? theme.palette.warning.main :
                                  theme.palette.error.main,
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                            <Chip
                              label={`${Math.round(predictiveData.prediction.confidence * 100)}% confidence`}
                              size="small"
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>

                          {/* Reasoning */}
                          {predictiveData.prediction.reasoning && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.info.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.info.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <InsightIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="info.main">
                                    Prediction Reasoning
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                  {predictiveData.prediction.reasoning}
                                </Typography>
                              </Stack>
                            </Card>
                          )}

                          {/* Performance Prediction */}
                          {predictiveData.prediction.performancePrediction && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.primary.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                    Performance Prediction
                        </Typography>
                                </Stack>
                                
                        <Stack spacing={3}>
                                  {predictiveData.prediction.performancePrediction.responseTime && (
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                                        Response Time:
                                      </Typography>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {predictiveData.prediction.performancePrediction.responseTime}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {predictiveData.prediction.performancePrediction.uptime && (
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                                        Uptime:
                                      </Typography>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {predictiveData.prediction.performancePrediction.uptime}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {predictiveData.prediction.performancePrediction.reliability && (
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                                        Reliability:
                                      </Typography>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {predictiveData.prediction.performancePrediction.reliability}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Stack>
                            </Card>
                          )}

                          {/* Failure Analysis */}
                          {predictiveData.prediction.failureAnalysis && predictiveData.prediction.failureAnalysis.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.error.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4]
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.error.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                    Failure Analysis
                                  </Typography>
                                </Stack>
                                
                                <Stack spacing={2}>
                                  {predictiveData.prediction.failureAnalysis.map((failure: string, index: number) => (
                                    <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.error.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
                                    }}>
                                      <Box sx={{
                                        p: 0.5,
                                        borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        mt: 0.25
                                      }}>
                                        <WarningIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                                      </Box>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {failure}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}

                          {/* Time-Based Risks */}
                          {predictiveData.prediction.timeBasedRisks && predictiveData.prediction.timeBasedRisks.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.warning.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4]
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.warning.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <TimeIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                                    Time-Based Risks
                                  </Typography>
                                </Stack>
                                
                                <Stack spacing={2}>
                                  {predictiveData.prediction.timeBasedRisks.map((risk: string, index: number) => (
                                    <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.warning.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                                    }}>
                                      <Box sx={{
                                        p: 0.5,
                                        borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.warning.main, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        mt: 0.25
                                      }}>
                                        <TimeIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                                      </Box>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {risk}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}

                          {/* Infrastructure Risks */}
                          {predictiveData.prediction.infrastructureRisks && predictiveData.prediction.infrastructureRisks.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.info.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4]
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.info.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <ShieldIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="info.main">
                                    Infrastructure Risks
                                  </Typography>
                                </Stack>
                                
                                <Stack spacing={2}>
                                  {predictiveData.prediction.infrastructureRisks.map((risk: string, index: number) => (
                                    <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.info.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                                    }}>
                                      <Box sx={{
                                        p: 0.5,
                                        borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.info.main, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        mt: 0.25
                                      }}>
                                        <ShieldIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                                      </Box>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {risk}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}
                          
                          {/* Risk Factors */}
                          {predictiveData.prediction.riskFactors && predictiveData.prediction.riskFactors.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.info.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4]
                              }
                            }}>
                              <Stack spacing={3}>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{
                                  p: 1,
                                  borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.info.main, 0.15),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                    <InsightIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                    Risk Factors
                                </Typography>
                              </Stack>
                                
                                    <Stack spacing={2}>
                                  {predictiveData.prediction.riskFactors.map((risk: string, index: number) => (
                                    <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.info.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                                    }}>
                                        <Box sx={{
                                          p: 0.5,
                                          borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.info.main, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        mt: 0.25
                                      }}>
                                        <InsightIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                                      </Box>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {risk}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}
                          
                          {/* Regional Predictions
                          {predictiveData.prediction.perWorkerPredictions && predictiveData.prediction.perWorkerPredictions.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.secondary.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <AnalysisIcon sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                                  </Box>
                                  <Stack>
                                    <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                                      Regional Predictions
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Predicted status for each monitoring region
                                    </Typography>
                                  </Stack>
                                </Stack>
                                
                                <Stack spacing={3}>
                                  {predictiveData.prediction.perWorkerPredictions.map((worker: any, index: number) => (
                                    <Box key={index} sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                                      position: 'relative'
                                    }}>
                                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Box sx={{
                                          p: 0.5,
                                          borderRadius: '50%',
                                          backgroundColor: worker.workerId === 'consensus_worker' 
                                            ? alpha(theme.palette.primary.main, 0.2)
                                            : alpha(theme.palette.secondary.main, 0.2),
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          minWidth: 32,
                                          height: 32
                                        }}>
                                          {worker.workerId === 'consensus_worker' ? (
                                            <TrendingUpIcon sx={{ 
                                              fontSize: 18, 
                                              color: theme.palette.primary.main 
                                            }} />
                                          ) : (
                                            <AnalysisIcon sx={{ 
                                              fontSize: 18, 
                                              color: theme.palette.secondary.main 
                                            }} />
                                          )}
                                        </Box>
                                        <Stack sx={{ flex: 1 }}>
                                          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                            {worker.workerId === 'consensus_worker' 
                                              ? 'Combined Prediction (All Regions)' 
                                              : `Monitoring Region: ${worker.workerId}`
                                            }
                                        </Typography>
                                          {worker.workerId === 'consensus_worker' && (
                                            <Typography variant="caption" color="text.secondary">
                                              Overall prediction combining all regional data
                                            </Typography>
                                          )}
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                        <Chip
                                            label={worker.predictedStatus.toUpperCase()}
                                          size="small"
                                          sx={{
                                              backgroundColor: 
                                                worker.predictedStatus === 'up' ? theme.palette.success.main :
                                                worker.predictedStatus === 'degraded' ? theme.palette.warning.main :
                                                theme.palette.error.main,
                                              color: 'white',
                                              fontWeight: 600,
                                            }}
                                          />
                                          <Chip
                                            label={`${Math.round(worker.confidence * 100)}%`}
                                            size="small"
                                            sx={{
                                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                              color: theme.palette.primary.main,
                                            fontWeight: 600,
                                          }}
                                        />
                                        </Stack>
                                      </Stack>
                                      
                                      {worker.reasoning && (
                                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                          {worker.reasoning}
                                            </Typography>
                                      )}
                                        </Box>
                                  ))}
                                      </Stack>
                                    </Stack>
                                  </Card>
                          )} */}
                          
                          {/* Recommendations */}
                          {predictiveData.prediction.recommendations && predictiveData.prediction.recommendations.length > 0 && (
                            <Card sx={{ 
                              p: 3, 
                              bgcolor: alpha(theme.palette.success.main, 0.05), 
                              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                              }
                            }}>
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.success.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <RecommendIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                    AI Recommendations
                                  </Typography>
                                </Stack>
                                
                                <Stack spacing={2}>
                                  {predictiveData.prediction.recommendations.map((recommendation: string, index: number) => (
                                    <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{
                                      p: 2,
                                      borderRadius: 1.5,
                                      backgroundColor: alpha(theme.palette.success.main, 0.03),
                                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                                    }}>
                                      <Box sx={{
                                        p: 0.5,
                                        borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.success.main, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        mt: 0.25
                                      }}>
                                        <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                                      </Box>
                                      <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {recommendation}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}

                        </Stack>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No prediction data available
                        </Typography>
                      )}
                    </Card>

                    {/* Token Usage Information */}
                    {predictiveData.prediction.tokenUsage && (
                      <Card sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Analysis Details:
                        </Typography>
                        <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Total tokens: {predictiveData.prediction.tokenUsage.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Input: {predictiveData.prediction.tokenUsage.prompt}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Output: {predictiveData.prediction.tokenUsage.completion}
                          </Typography>
                          {predictiveData.prediction.tokenUsage.cacheHits && (
                            <Typography variant="body2" color="success.main">
                              Cache hits: {predictiveData.prediction.tokenUsage.cacheHits}
                            </Typography>
                          )}
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                )}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No predictive analysis available
                </Typography>
                <Button 
                  onClick={fetchPredictiveSummary}
                  startIcon={<PredictiveIcon />}
                  variant="contained"
                >
                  Generate Prediction
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.default, 0.3)
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Close
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {tabValue === 0 && !isAnalysisLoading && (
          <Button 
            onClick={fetchAnalysis} 
            variant="contained"
            startIcon={<AnalysisIcon />}
            sx={{ borderRadius: 1 }}
          >
            Refresh Analysis
          </Button>
        )}
        {tabValue === 1 && !isPredictiveLoading && (
          <Button 
            onClick={fetchPredictiveSummary} 
            variant="contained"
            startIcon={<PredictiveIcon />}
            sx={{ borderRadius: 1 }}
          >
            Refresh Summary
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 