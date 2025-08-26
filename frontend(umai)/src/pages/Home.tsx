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
              Start Your AI Uptime Monitoring Service From Home
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
              Launch a client service that monitors websites with AI and explains issues in plain English. No inventory and no coding required. With focus and effort, this can become a steady income stream; actual results depend on your market, pricing, and effort.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Comparison Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#1E293B',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              Traditional Monitoring vs. Our AI
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748B',
                maxWidth: '700px',
                mx: 'auto',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.6,
              }}
            >
              Why AI-powered diagnostics help you serve clients better
            </Typography>
          </Box>

          {/* Smartphone Comparison with Original Images */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
              mb: 6,
            }}
          >
            {/* Traditional Monitoring (UptimeRobot) */}
            <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 320 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#EF4444' }}>
                Traditional Monitoring
              </Typography>
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

            {/* AgencyUptime AI Monitoring */}
            <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 320 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#10B981' }}>
                AgencyUptime AI Monitoring
              </Typography>
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
          </Box>

          {/* Comparison Legend */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 4,
                maxWidth: 800,
                mx: 'auto',
              }}
            >
              {/* Traditional Monitoring */}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#EF4444', textAlign: 'center' }}>
                  Traditional Monitoring
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    'Says a site is down without context',
                    'No guidance on likely causes',
                    'Limited to basic checks'
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        color: '#EF4444', 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}>
                        ✗
                      </Box>
                      <Typography variant="body1" sx={{ color: '#64748B' }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* AI Monitoring */}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#10B981', textAlign: 'center' }}>
                  AI Monitoring
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    'Explains issues in plain English',
                    'Suggests next steps to resolve',
                    'Options for proactive checks'
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        color: '#10B981', 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}>
                        ✓
                      </Box>
                      <Typography variant="body1" sx={{ color: '#64748B' }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Business Benefits Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#1E293B',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              A simple service you can run from home
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748B',
                maxWidth: '700px',
                mx: 'auto',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.6,
              }}
            >
              Everything you need to offer monitoring and clear diagnostics to clients
            </Typography>
          </Box>

          {/* Feature Cards Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 4,
            }}
          >
            {/* Card 1: Low startup cost */}
            <Box
              sx={{
                background: 'white',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  $
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
                Low startup cost
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                Start on a free trial. No large investments or hardware required.
              </Typography>
            </Box>

            {/* Card 2: No inventory */}
            <Box
              sx={{
                background: 'white',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 20,
                    background: 'white',
                    borderRadius: '2px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 4,
                      left: 2,
                      right: 2,
                      height: 2,
                      background: 'white',
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 8,
                      left: 2,
                      right: 2,
                      height: 2,
                      background: 'white',
                      borderRadius: '1px',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
                No inventory
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                Pure software service. Nothing to stock or ship.
              </Typography>
            </Box>

            {/* Card 3: Subscription friendly */}
            <Box
              sx={{
                background: 'white',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    background: 'white',
                    borderRadius: '4px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      right: 2,
                      height: 2,
                      background: 'white',
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 6,
                      left: 2,
                      right: 2,
                      height: 2,
                      background: 'white',
                      borderRadius: '1px',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '25%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    background: '#8B5CF6',
                    borderRadius: '50%',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 4,
                      height: 2,
                      background: 'white',
                      borderRadius: '1px',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 2,
                      height: 4,
                      background: 'white',
                      borderRadius: '1px',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
                Subscription friendly
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                Use monthly or annual billing if you choose. You control your pricing.
              </Typography>
            </Box>

            {/* Card 4: No coding required */}
            <Box
              sx={{
                background: 'white',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  &lt;/&gt;
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
                No coding required
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                Our AI explains issues in plain English so you can communicate clearly with clients.
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
        </Container>
      </Box>

      {/* Footer */}
      <Footer variant="public" />
    </Box>
  );
} 