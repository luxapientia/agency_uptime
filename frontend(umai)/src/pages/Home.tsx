import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  Fade,
  Grow,
  Slide,
  Zoom,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ArrowDownward,
  TrendingUp,
  Shield,
} from '@mui/icons-material';
import Footer from '../components/layout/Footer';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchMembershipPlans } from '../store/slices/membershipSlice';
import type { MembershipPlan } from '../types/membership.types';
import { getFeatureDescription, isValidFeatureKey } from '../utils/featureUtils';

export default function Home() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { plans, isLoading } = useSelector((state: RootState) => state.membership);

  useEffect(() => {
    dispatch(fetchMembershipPlans());
  }, [dispatch]);

  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.6) 100%), url('/home_head.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          minHeight: '100vh',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)',
            animation: 'shimmer 3s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.6 },
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      >
        {/* Floating Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 20,
            height: 20,
            background: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(180deg)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: 16,
            height: 16,
            background: 'rgba(139, 92, 246, 0.3)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '30%',
            left: '20%',
            width: 12,
            height: 12,
            background: 'rgba(16, 185, 129, 0.3)',
            borderRadius: '50%',
            animation: 'float 7s ease-in-out infinite',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={heroVisible} timeout={1000}>
            <Box sx={{ textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
              <Grow in={heroVisible} timeout={1500}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 4,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                    lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                    letterSpacing: '-0.02em',
                    animation: 'glow 2s ease-in-out infinite alternate',
                    '@keyframes glow': {
                      '0%': { filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' },
                      '100%': { filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))' },
                    },
                  }}
                >
                  Start Your AI Uptime Monitoring Service From Home
                </Typography>
              </Grow>
              
              <Slide direction="up" in={heroVisible} timeout={2000}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 6,
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.6,
                    maxWidth: '700px',
                    mx: 'auto',
                    color: 'rgba(255, 255, 255, 0.95)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                    fontWeight: 400,
                  }}
                >
                  Launch a client service that monitors websites with AI and explains issues in plain English. No inventory and no coding required. With focus and effort, this can become a steady income stream; actual results depend on your market, pricing, and effort.
                </Typography>
              </Slide>

              {/* CTA Button */}
              <Zoom in={heroVisible} timeout={2500}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    color: 'white',
                    px: 6,
                    py: 3,
                    borderRadius: '50px',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 48px rgba(59, 130, 246, 0.4)',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    },
                    '&:active': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <TrendingUp sx={{ fontSize: 24 }} />
                  Get Started Today
                </Box>
              </Zoom>

              {/* Scroll Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'bounce 2s infinite',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateX(-50%) translateY(0)' },
                    '40%': { transform: 'translateX(-50%) translateY(-10px)' },
                    '60%': { transform: 'translateX(-50%) translateY(-5px)' },
                  },
                }}
              >
                <ArrowDownward sx={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.7)' }} />
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Comparison Section */}
      <Box sx={{ 
        py: { xs: 8, md: 12 }, 
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '40%',
          background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
        },
      }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                }}
              >
                AI vs Traditional
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 4,
                  background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                Traditional Monitoring vs. Our AI
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#64748B',
                  maxWidth: '700px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Why AI-powered diagnostics help you serve clients better
              </Typography>
            </Box>
          </Fade>

          {/* Smartphone Comparison with Original Images */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              mb: 8,
            }}
          >
            {/* Traditional Monitoring (UptimeRobot) */}
            <Grow in={true} timeout={1500}>
              <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 320 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                    color: '#DC2626',
                    px: 3,
                    py: 1.5,
                    borderRadius: '25px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    mb: 3,
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <Cancel sx={{ fontSize: 16 }} />
                  Traditional Monitoring
                </Box>
                <Box
                  sx={{
                    width: 280,
                    height: 500,
                    background: 'white',
                    borderRadius: '24px',
                    border: '8px solid #1F2937',
                    mx: 'auto',
                    mb: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) rotateY(5deg)',
                      boxShadow: '0 32px 64px rgba(239, 68, 68, 0.2)',
                    },
                  }}
                >
                {/* Phone Header */}
                <Box sx={{ 
                  background: '#1F2937', 
                  color: 'white', 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.75rem'
                }}>
                  <span>8:42</span>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ width: 16, height: 8, border: '1px solid white', borderRadius: 1, position: 'relative' }}>
                      <Box sx={{ width: '61%', height: '100%', background: 'white', borderRadius: 0.5 }} />
                    </Box>
                    <span>61%</span>
                  </Box>
                </Box>
                
                {/* Original UptimeRobot Image */}
                <Box
                  component="img"
                  src="/robot-error.jpg"
                  alt="UptimeRobot Error Screen"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    flex: 1,
                  }}
                />
              </Box>
            </Box>
            </Grow>

            {/* AgencyUptime AI Monitoring */}
            <Grow in={true} timeout={2000}>
              <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 320 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                    color: '#059669',
                    px: 3,
                    py: 1.5,
                    borderRadius: '25px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    mb: 3,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Shield sx={{ fontSize: 16 }} />
                  AI Monitoring
                </Box>
              <Box
                sx={{
                  width: 280,
                  height: 500,
                  background: 'white',
                  borderRadius: '24px',
                  border: '8px solid #1F2937',
                  mx: 'auto',
                  mb: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px) rotateY(-5deg)',
                    boxShadow: '0 32px 64px rgba(16, 185, 129, 0.2)',
                  },
                }}
              >
                {/* Phone Header */}
                <Box sx={{ 
                  background: '#1F2937', 
                  color: 'white', 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.75rem'
                }}>
                  <span>8:42</span>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ width: 16, height: 8, border: '1px solid white', borderRadius: 1, position: 'relative' }}>
                      <Box sx={{ width: '61%', height: '100%', background: 'white', borderRadius: 0.5 }} />
                    </Box>
                    <span>61%</span>
                  </Box>
                </Box>
                
                {/* Original AgencyUptime Image */}
                <Box
                  component="img"
                  src="/uptime-error.jpg"
                  alt="AgencyUptime Error Screen"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    flex: 1,
                  }}
                />
              </Box>
            </Box>
            </Grow>
          </Box>

          {/* Comparison Legend */}
          <Fade in={true} timeout={2500}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 6,
                  maxWidth: 900,
                  mx: 'auto',
                }}
              >
                {/* Traditional Monitoring */}
                <Slide direction="left" in={true} timeout={3000}>
                  <Box 
                    sx={{ 
                      textAlign: 'left',
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      p: 4,
                      borderRadius: '20px',
                      border: '1px solid rgba(239, 68, 68, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 16px 32px rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#DC2626', textAlign: 'center' }}>
                      Traditional Monitoring
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[
                        'Says a site is down without context',
                        'No guidance on likely causes',
                        'Limited to basic checks'
                      ].map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box sx={{ 
                            color: '#EF4444', 
                            fontSize: '1.5rem', 
                            fontWeight: 'bold',
                            lineHeight: 1,
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            ✗
                          </Box>
                          <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Slide>

                {/* AI Monitoring */}
                <Slide direction="right" in={true} timeout={3500}>
                  <Box 
                    sx={{ 
                      textAlign: 'left',
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      p: 4,
                      borderRadius: '20px',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 16px 32px rgba(16, 185, 129, 0.1)',
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#059669', textAlign: 'center' }}>
                      AI Monitoring
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[
                        'Explains issues in plain English',
                        'Suggests next steps to resolve',
                        'Options for proactive checks'
                      ].map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box sx={{ 
                            color: '#10B981', 
                            fontSize: '1.5rem', 
                            fontWeight: 'bold',
                            lineHeight: 1,
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            ✓
                          </Box>
                          <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Slide>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Business Benefits Section */}
      <Box sx={{ 
        py: { xs: 8, md: 12 }, 
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
        },
      }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                }}
              >
                Business Benefits
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 4,
                  background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                A simple service you can run from home
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#64748B',
                  maxWidth: '700px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Everything you need to offer monitoring and clear diagnostics to clients
              </Typography>
            </Box>
          </Fade>

          {/* Feature Cards Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 4,
            }}
          >
            {[
              {
                icon: '$',
                title: 'Low startup cost',
                description: 'Start on a free trial. No large investments or hardware required.',
                color: '#8B5CF6',
                delay: 0,
              },
              {
                icon: <Box sx={{ width: 24, height: 20, background: 'white', borderRadius: '2px' }} />,
                title: 'No inventory',
                description: 'Pure software service. Nothing to stock or ship.',
                color: '#8B5CF6',
                delay: 200,
              },
              {
                icon: <Box sx={{ width: 24, height: 24, background: 'white', borderRadius: '4px' }} />,
                title: 'Subscription friendly',
                description: 'Use monthly or annual billing if you choose. You control your pricing.',
                color: '#8B5CF6',
                delay: 400,
              },
              {
                icon: <>&lt;/&gt;</>,
                title: 'No coding required',
                description: 'Our AI explains issues in plain English so you can communicate clearly with clients.',
                color: '#8B5CF6',
                delay: 600,
              },
            ].map((card, index) => (
              <Zoom in={true} timeout={1000 + card.delay} key={index}>
                <Box
                  sx={{
                    background: 'white',
                    borderRadius: '24px',
                    p: 4,
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}80 100%)`,
                      transform: 'scaleX(0)',
                      transition: 'transform 0.3s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
                      '&::before': {
                        transform: 'scaleX(1)',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}80 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: `0 16px 32px ${card.color}40`,
                      },
                    }}
                  >
                    {typeof card.icon === 'string' ? (
                      <Typography
                        sx={{
                          color: 'white',
                          fontSize: '1.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {card.icon}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          color: 'white',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          fontFamily: card.title === 'No coding required' ? 'monospace' : 'inherit',
                        }}
                      >
                        {card.icon}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                    {card.description}
                  </Typography>
                </Box>
              </Zoom>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Membership Plans Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: theme.palette.grey[50] }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              Choose Your Plan
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: '700px',
                mx: 'auto',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.6,
              }}
            >
              Start with our free trial and scale as your agency grows. All plans include our AI-powered monitoring technology.
            </Typography>
          </Box>

          {/* Plans Grid */}
          {!isLoading && plans.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4,
                mb: 6,
              }}
            >
              {plans
                .filter((plan: MembershipPlan) => plan.type === 'main')
                .map((plan: MembershipPlan) => (
                  <Box
                    key={plan.id}
                    sx={{
                      background: 'white',
                      borderRadius: 3,
                      p: 4,
                      textAlign: 'center',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      border: plan.name === 'Agency' ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    {/* Popular Badge */}
                    {plan.name === 'Agency' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: theme.palette.primary.main,
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Most Popular
                      </Box>
                    )}

                    {/* Plan Header */}
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                      {plan.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                      {plan.description}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        ${plan.price}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        per month
                      </Typography>
                    </Box>

                    {/* Features */}
                    <Box sx={{ mb: 4 }}>
                      {plan.features.map((feature, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2,
                            textAlign: 'left',
                          }}
                        >
                          <CheckCircle
                            sx={{
                              color: theme.palette.success.main,
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {isValidFeatureKey(feature) ? getFeatureDescription(feature) : feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>


                  </Box>
                ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Footer variant="public" />
    </Box>
  );
} 