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
  Divider,
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
  TrendingDown as RiskIcon,
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

interface UpcomingRisk {
  risk: string;
  probability: number;
  timeframe: string;
  mitigation: string;
}

interface PredictiveSummary {
  period: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  keyInsights: string[];
  upcomingRisks: UpcomingRisk[];
  recommendations: string[];
  tokenUsage: TokenUsage;
}

interface DiagnosticResult {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  predictedIssues?: string[];
  confidence: number;
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
  const [predictiveData, setPredictiveData] = useState<{ summary: PredictiveSummary; sitesAnalyzed: number; period: string; generatedAt: string } | null>(null);
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
      const response = await axios.post('/ai/predictive-summary', {
        siteIds: [siteId],
        period: '24h'
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
                      Predictive Summary
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(predictiveData.generatedAt).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {predictiveData.period}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AnalysisIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {predictiveData.sitesAnalyzed} sites
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>

                {/* Summary Content */}
                {predictiveData.summary && (
                  <Stack spacing={3}>
                    {/* Overall Health Status */}
                    <Card sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PredictiveIcon color="primary" />
                        AI Predictive Analysis - {predictiveData.period}
                      </Typography>
                      
                      {/* Overall Health Badge */}
                      {predictiveData.summary.overallHealth && (
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Overall Health:
                          </Typography>
                          <Chip
                            label={predictiveData.summary.overallHealth.toUpperCase()}
                            sx={{
                              backgroundColor: 
                                predictiveData.summary.overallHealth === 'excellent' ? theme.palette.success.main :
                                predictiveData.summary.overallHealth === 'good' ? theme.palette.info.main :
                                predictiveData.summary.overallHealth === 'fair' ? theme.palette.warning.main :
                                predictiveData.summary.overallHealth === 'poor' ? theme.palette.error.main :
                                theme.palette.grey[500],
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                      )}
                      
                      {/* Handle different summary formats */}
                      {typeof predictiveData.summary === 'string' ? (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {predictiveData.summary}
                        </Typography>
                      ) : predictiveData.summary && typeof predictiveData.summary === 'object' ? (
                        <Stack spacing={3}>
                          {/* Key Insights */}
                          {predictiveData.summary.keyInsights && predictiveData.summary.keyInsights.length > 0 && (
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
                                    Key Insights
                                  </Typography>
                                </Stack>
                                
                                <Stack spacing={2}>
                                  {predictiveData.summary.keyInsights.map((insight: string, index: number) => (
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
                                        {insight}
                                      </Typography>
                                    </Stack>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )}
                          
                          {/* Upcoming Risks */}
                          {predictiveData.summary.upcomingRisks && predictiveData.summary.upcomingRisks.length > 0 && (
                            <Box>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{
                                  p: 1,
                                  borderRadius: 1,
                                  backgroundColor: alpha(theme.palette.error.main, 0.15),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <RiskIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                  Upcoming Risks
                                </Typography>
                              </Stack>
                              <Stack spacing={2} sx={{ mt: 2 }}>
                                {predictiveData.summary.upcomingRisks.map((risk: {
                                  risk: string;
                                  probability: number;
                                  timeframe: string;
                                  mitigation: string;
                                }, index: number) => (
                                  <Card key={index} sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                                    <Stack spacing={2}>
                                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                        <Box sx={{
                                          p: 0.5,
                                          borderRadius: '50%',
                                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          minWidth: 32,
                                          height: 32
                                        }}>
                                          <RiskIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                                        </Box>
                                        <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
                                          {risk.risk}
                                        </Typography>
                                        <Chip
                                          label={`${Math.round(risk.probability * 100)}% probability`}
                                          size="small"
                                          sx={{
                                            backgroundColor: theme.palette.error.main,
                                            color: '#ffffff',
                                            fontWeight: 600,
                                          }}
                                        />
                                      </Stack>
                                      
                                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                              Timeframe:
                                            </Typography>
                                          </Stack>
                                          <Typography variant="body1">
                                            {risk.timeframe}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <ShieldIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                              Mitigation:
                                            </Typography>
                                          </Stack>
                                          <Typography variant="body1">
                                            {risk.mitigation}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </Stack>
                                  </Card>
                                ))}
                              </Stack>
                            </Box>
                          )}
                          
                          {/* Recommendations */}
                          {predictiveData.summary.recommendations && predictiveData.summary.recommendations.length > 0 && (
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
                                  {predictiveData.summary.recommendations.map((recommendation: string, index: number) => (
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
                          No summary data available
                        </Typography>
                      )}
                    </Card>

                    {/* Token Usage Information */}
                    {predictiveData.summary.tokenUsage && (
                      <Card sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Analysis Details:
                        </Typography>
                        <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Total tokens: {predictiveData.summary.tokenUsage.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Input: {predictiveData.summary.tokenUsage.prompt}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Output: {predictiveData.summary.tokenUsage.completion}
                          </Typography>
                          {predictiveData.summary.tokenUsage.cacheHits && (
                            <Typography variant="body2" color="success.main">
                              Cache hits: {predictiveData.summary.tokenUsage.cacheHits}
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
                  No predictive summary available
                </Typography>
                <Button 
                  onClick={fetchPredictiveSummary}
                  startIcon={<PredictiveIcon />}
                  variant="contained"
                >
                  Generate Summary
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