import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  useTheme,
  alpha,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Phone,
  Email,
  GitHub,
  LinkedIn,
  Twitter,
  MonitorHeart,
  Speed,
  Shield,
  CheckCircle,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  variant?: 'default' | 'public';
}

export default function Footer({ variant = 'default' }: FooterProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const footerContent = {
    contact: {
      title: 'Get In Touch!',
      phone: '1-727-346-6423',
      email: 'hi@uptimemonitoring.ai',
      address: '123 Tech Street, Digital City, DC 12345',
    },
    resources: {
      title: 'Quick Links',
      links: [
        { text: 'FAQ', path: '/faq' },
        { text: 'Privacy Policy', path: '/privacy-policy' },
        { text: 'Terms and Conditions', path: '/terms' },
      ],
    },
    about: {
      title: 'About Uptime Monitoring',
      description: 'Uptime Monitoring is a professional website monitoring platform that provides real-time uptime tracking, SSL certificate monitoring, and comprehensive performance analytics. Our AI-powered system instantly detects, diagnoses, and explains website outages—delivering detailed reports and actionable insights.',
    },
  };

  const socialLinks = [
    { icon: <GitHub />, href: 'https://github.com', label: 'GitHub' },
    { icon: <LinkedIn />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <Twitter />, href: 'https://twitter.com', label: 'Twitter' },
  ];

  const features = [
    { icon: <Speed />, text: 'Real-time Monitoring', color: '#3B82F6' },
    { icon: <Shield />, text: 'SSL & Security', color: '#10B981' },
    { icon: <CheckCircle />, text: 'AI-Powered Analysis', color: '#8B5CF6' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: variant === 'public' 
          ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
          : theme.palette.mode === 'dark'
            ? '#0F172A'
            : '#F8FAFC',
        color: variant === 'public' ? 'white' : theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: variant === 'public' 
            ? 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
          zIndex: 0,
        },
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          height: 4,
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #10B981)',
          opacity: 0.9,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Feature highlights section */}
        {variant === 'public' && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              py: 6,
              flexWrap: 'wrap',
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  minWidth: 200,
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(feature.color, 0.3)}`,
                    borderColor: feature.color,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${feature.color} 0%, ${alpha(feature.color, 0.7)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: `0 8px 25px ${alpha(feature.color, 0.4)}`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  >
                    {feature.text}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 6,
            py: 8,
          }}
        >
          {/* Contact Section */}
          <Box sx={{ flex: { xs: '1', md: '1' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                }}
              >
                <MonitorHeart sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: variant === 'public' ? 'white' : '#1E293B',
                  fontSize: '1.5rem',
                }}
              >
                {footerContent.contact.title}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '12px',
                  background: variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2.5,
                  border: `1px solid ${variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)'}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    background: variant === 'public' 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(59, 130, 246, 0.2)',
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                  },
                }}
              >
                <Phone sx={{ 
                  color: variant === 'public' ? 'white' : '#3B82F6',
                  fontSize: 20,
                }} />
              </Box>
              <Link
                href={`tel:${footerContent.contact.phone}`}
                sx={{
                  color: variant === 'public' ? 'white' : '#1E293B',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    color: '#3B82F6',
                    transform: 'translateX(6px)',
                  },
                }}
              >
                {footerContent.contact.phone}
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '12px',
                  background: variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2.5,
                  border: `1px solid ${variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(139, 92, 246, 0.2)'}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    background: variant === 'public' 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(139, 92, 246, 0.2)',
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
                  },
                }}
              >
                <Email sx={{ 
                  color: variant === 'public' ? 'white' : '#8B5CF6',
                  fontSize: 20,
                }} />
              </Box>
              <Link
                href={`mailto:${footerContent.contact.email}`}
                sx={{
                  color: variant === 'public' ? 'white' : '#1E293B',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    color: '#8B5CF6',
                    transform: 'translateX(6px)',
                  },
                }}
              >
                {footerContent.contact.email}
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '12px',
                  background: variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2.5,
                  border: `1px solid ${variant === 'public' 
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)'}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    background: variant === 'public' 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <LocationOn sx={{ 
                  color: variant === 'public' ? 'white' : '#10B981',
                  fontSize: 20,
                }} />
              </Box>
              <Typography
                sx={{
                  color: variant === 'public' ? 'rgba(255, 255, 255, 0.8)' : '#64748B',
                  fontWeight: 500,
                  fontSize: '1rem',
                  lineHeight: 1.4,
                }}
              >
                {footerContent.contact.address}
              </Typography>
            </Box>
          </Box>

          {/* Resources Section */}
          <Box sx={{ flex: { xs: '1', md: '1' } }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 4,
                color: variant === 'public' ? 'white' : '#1E293B',
                fontSize: '1.4rem',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 50,
                  height: 3,
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                  borderRadius: 2,
                },
              }}
            >
              {footerContent.resources.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {footerContent.resources.links.map((link, index) => (
                <Box
                  key={index}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: variant === 'public' ? 'rgba(255, 255, 255, 0.8)' : '#64748B',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                    borderRadius: 2,
                    '&:hover': {
                      color: variant === 'public' ? 'white' : '#3B82F6',
                      background: variant === 'public' 
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                      transform: 'translateX(8px)',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                    },
                    '&::before': {
                      content: '""',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: variant === 'public' 
                        ? 'rgba(255, 255, 255, 0.6)'
                        : '#3B82F6',
                      mr: 2,
                      transition: 'all 0.3s ease-in-out',
                    },
                    '&:hover::before': {
                      background: '#8B5CF6',
                      transform: 'scale(1.5)',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                    },
                  }}
                >
                  {link.text}
                </Box>
              ))}
            </Box>
          </Box>

          {/* About Section */}
          <Box sx={{ flex: { xs: '1', md: '2' } }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 4,
                color: variant === 'public' ? 'white' : '#1E293B',
                fontSize: '1.4rem',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 50,
                  height: 3,
                  background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                  borderRadius: 2,
                },
              }}
            >
              {footerContent.about.title}
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: variant === 'public' ? 'rgba(255, 255, 255, 0.9)' : '#64748B',
                lineHeight: 1.8,
                fontSize: '1rem',
                mb: 4,
                textAlign: 'justify',
              }}
            >
              {footerContent.about.description}
            </Typography>

            {/* Social Links */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: 50,
                    height: 50,
                    background: variant === 'public' 
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)',
                    color: variant === 'public' ? 'white' : '#3B82F6',
                    border: `2px solid ${variant === 'public' 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(59, 130, 246, 0.2)'}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      background: variant === 'public' 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(59, 130, 246, 0.2)',
                      transform: 'translateY(-6px) rotate(10deg)',
                      borderColor: '#8B5CF6',
                      boxShadow: '0 12px 30px rgba(139, 92, 246, 0.4)',
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Divider 
          sx={{ 
            borderColor: variant === 'public' 
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(59, 130, 246, 0.2)',
            mb: 4,
            borderWidth: 1,
          }} 
        />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'space-between' },
            gap: { xs: 3, sm: 0 },
            pb: 5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
              }}
            >
              <MonitorHeart sx={{ 
                color: 'white',
                fontSize: 22,
              }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: variant === 'public' ? 'white' : '#1E293B',
                fontSize: '1.3rem',
                background: variant === 'public' 
                  ? 'transparent'
                  : 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: variant === 'public' ? 'unset' : 'text',
                WebkitTextFillColor: variant === 'public' ? 'white' : 'transparent',
              }}
            >
              Uptime Monitoring
            </Typography>
          </Box>
          
          <Typography
            variant="body2"
            sx={{
              color: variant === 'public' ? 'rgba(255, 255, 255, 0.7)' : '#94A3B8',
              fontSize: '0.9rem',
              textAlign: { xs: 'center', sm: 'right' },
              fontWeight: 500,
            }}
          >
            © {new Date().getFullYear()} Uptime Monitoring. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 