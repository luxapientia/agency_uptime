import {
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import Footer from '../components/layout/Footer';

export default function Home() {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('/home_head.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          py: { xs: 2, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                lineHeight: 1.2,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
              }}
            >
              White-Label AI Uptime Monitoring For Digital Agencies
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1.5,
                maxWidth: '600px',
                mx: 'auto',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
              }}
            >
              The only monitoring platform that predicts and prevents downtime using AI, while letting you keep 100% of the profits.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Comparison Section */}
      <Box sx={{ py: { xs: 2, md: 4 }, background: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 3,
              p: 4,
              maxWidth: 1000,
              mx: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 4,
                color: theme.palette.text.primary,
                textAlign: 'center',
              }}
            >
              Why 'It's Down' isn't enough anymore
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
                alignItems: 'flex-start',
              }}
            >
              {/* AgencyUptime Side */}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: theme.palette.success.main }}>
                  AgencyUptime.com
                </Typography>
                <Box
                  component="img"
                  src="/uptime-error.jpg"
                  alt="AgencyUptime Error Screen"
                  sx={{
                    width: '100%',
                    maxWidth: 350,
                    height: 'auto',
                    borderRadius: 2,
                    mb: 3,
                    border: `2px solid ${theme.palette.success.main}`,
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', textAlign: 'left' }}>
                  {[
                    { label: 'Diagnosis:', value: 'HTTP layer failure detected' },
                    { label: 'Root Cause:', value: 'Resource constraint or misconfiguration' },
                    { label: 'Severity:', value: 'HIGH (Confidence: 95%)' },
                    { label: 'Region Affected:', value: 'Southeast' },
                    { label: 'Fix:', value: 'Edit `config/database.yml`, consider load balancing' },
                    { label: 'Insight:', value: 'AI analyzed DNS, TCP, HTTP, and logs to isolate the issue' },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                      <CheckCircle
                        sx={{
                          color: theme.palette.success.main,
                          fontSize: 24,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontFamily: item.value.includes('`') ? 'monospace' : 'inherit',
                            backgroundColor: item.value.includes('`') ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                            px: item.value.includes('`') ? 1 : 0,
                            py: item.value.includes('`') ? 0.5 : 0,
                            borderRadius: item.value.includes('`') ? 1 : 0,
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* UptimeRobot Side */}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: theme.palette.error.main }}>
                  UptimeRobot
                </Typography>
                <Box
                  component="img"
                  src="/robot-error.jpg"
                  alt="UptimeRobot Error Screen"
                  sx={{
                    width: '100%',
                    maxWidth: 350,
                    height: 'auto',
                    borderRadius: 2,
                    mb: 3,
                    border: `2px solid ${theme.palette.error.main}`,
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', textAlign: 'left' }}>
                  {[
                    { label: 'Diagnosis:', value: 'Your site is down' },
                    { label: 'Root Cause:', value: 'Connection Timeout' },
                    { label: 'Severity:', value: 'Unspecified' },
                    { label: 'Region Affected:', value: 'Unknown' },
                    { label: 'Fix:', value: '—' },
                    { label: 'Insight:', value: 'None. You\'re on your own.' },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                      <Cancel
                        sx={{
                          color: theme.palette.error.main,
                          fontSize: 24,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Footer variant="public" />
    </Box>
  );
} 