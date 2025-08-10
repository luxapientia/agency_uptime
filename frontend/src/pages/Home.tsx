import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Monitor,
  Security,
  Notifications,
  Analytics,
  Speed,
  Dashboard,
  CheckCircle,
  Star,
  TrendingUp,
  Support,
  Rocket,
  Shield,
} from '@mui/icons-material';
import Footer from '../components/layout/Footer';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

      {/* Footer */}
      <Footer variant="public" />
    </Box>
  );
} 