import { useEffect } from 'react';
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

      {/* AI Features Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: theme.palette.background.default }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            {/* AI-POWERED Label */}
            <Box
              sx={{
                display: 'inline-block',
                background: theme.palette.primary.main,
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 2,
              }}
            >
              AI-POWERED
            </Box>
            
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              AI That Works For Your Agency
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
              Our AI doesn't just monitor - it predicts, explains, and helps prevent downtime before it happens.
            </Typography>
          </Box>

          {/* Feature Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            {/* Card 1: Predictive Monitoring */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 24,
                    height: 24,
                    background: 'white',
                    borderRadius: '2px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      background: 'white',
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '60%',
                      height: '2px',
                      background: 'white',
                      borderRadius: '1px',
                      transform: 'translateY(-4px)',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Predictive Monitoring
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Our AI analyzes patterns to predict potential outages before they occur, giving you time to prevent them.
              </Typography>
            </Box>

            {/* Card 2: Plain English Reports */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 20,
                    height: 24,
                    background: 'white',
                    borderRadius: '2px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      right: 2,
                      height: 1,
                      background: 'white',
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 6,
                      left: 2,
                      right: 2,
                      height: 1,
                      background: 'white',
                      borderRadius: '1px',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Plain English Reports
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                No technical jargon. AI generates client-friendly reports that explain downtime in simple terms.
              </Typography>
            </Box>

            {/* Card 3: Automated Mitigation */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 24,
                    height: 24,
                    background: 'white',
                    borderRadius: '50%',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 12,
                      height: 12,
                      background: theme.palette.primary.main,
                      borderRadius: '50%',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Automated Mitigation
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                For common issues, our AI can automatically implement fixes or suggest solutions to your team.
              </Typography>
            </Box>

            {/* Card 4: Performance Insights */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 24,
                    height: 24,
                    background: 'white',
                    borderRadius: '50%',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8,
                      height: 8,
                      background: theme.palette.primary.main,
                      borderRadius: '50%',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16,
                      height: 16,
                      border: '2px solid white',
                      borderRadius: '50%',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Performance Insights
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                AI identifies performance trends and optimization opportunities across all client sites.
              </Typography>
            </Box>

            {/* Card 5: Root Cause Analysis */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 24,
                    height: 24,
                    background: 'white',
                    borderRadius: '50%',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16,
                      height: 2,
                      background: theme.palette.primary.main,
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 2,
                      height: 16,
                      background: theme.palette.primary.main,
                      borderRadius: '1px',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Root Cause Analysis
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                When downtime occurs, our AI pinpoints the likely cause and provides detailed diagnostics.
              </Typography>
            </Box>

            {/* Card 6: 100% White-Label */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 24,
                    height: 16,
                    background: 'white',
                    borderRadius: '2px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      background: 'white',
                      borderRadius: '50%',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                100% White-Label
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Full customization with your branding. Clients will think you built this AI technology.
              </Typography>
            </Box>
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

          {/* Upgrade Plans Section */}
          {!isLoading && plans.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                }}
              >
                Add-On Features
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 4,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Enhance your monitoring with powerful add-ons. Buy individually or bundle for savings.
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 3,
                  mb: 4,
                }}
              >
                {plans
                  .filter((plan: MembershipPlan) => plan.type === 'upgrade')
                  .map((plan: MembershipPlan) => (
                    <Box
                      key={plan.id}
                      sx={{
                        background: 'white',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                        {plan.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2, minHeight: 40 }}>
                        {plan.description}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 2 }}>
                        ${plan.price}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Footer variant="public" />
    </Box>
  );
} 