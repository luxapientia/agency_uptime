import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Phone,
  Email,
  Business,
  GitHub,
  LinkedIn,
  Twitter,
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
      email: 'hi@agencyuptime.com',
    },
    resources: {
      title: 'Additional Resources',
      links: [
        { text: 'FAQ', path: '/faq' },
        { text: 'Privacy Policy', path: '/privacy-policy' },
        { text: 'Terms and Conditions', path: '/terms' },
      ],
    },
    about: {
      title: 'About Us',
      description: 'Agency Uptime (AU) is the first AI-powered, fully white-labeled uptime monitoring platform built for digital agencies. We instantly detect, diagnose, and explain website outages—delivering plain-English, client-ready reports under your brand. Our platform turns monitoring from a cost center into a profit engine, giving agencies premium diagnostics, white-label dashboards, and unbeatable value for every client site they manage. Powered by AI. Designed for agencies. Ready to scale with you.',
    },
  };

  const socialLinks = [
    { icon: <GitHub />, href: 'https://github.com', label: 'GitHub' },
    { icon: <LinkedIn />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <Twitter />, href: 'https://twitter.com', label: 'Twitter' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: variant === 'public' 
          ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
          : theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha(theme.palette.background.paper, 0.98),
        color: variant === 'public' ? 'white' : theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
        '&::before': variant === 'public' ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
          zIndex: 0,
        } : {},
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          height: 2,
          background: variant === 'public' 
            ? `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.light})`
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          opacity: 0.8,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            py: 6,
          }}
        >
          {/* Contact Section */}
          <Box sx={{ flex: { xs: '1', md: '1' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: variant === 'public' ? 'white' : theme.palette.primary.main,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {footerContent.contact.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: variant === 'public' 
                    ? alpha(theme.palette.common.white, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  transition: theme.transitions.create(['background', 'transform'], {
                    duration: theme.transitions.duration.standard,
                  }),
                  '&:hover': {
                    background: variant === 'public' 
                      ? alpha(theme.palette.common.white, 0.3)
                      : alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Phone sx={{ color: variant === 'public' ? 'white' : theme.palette.primary.main }} />
              </Box>
              <Link
                href={`tel:${footerContent.contact.phone}`}
                sx={{
                  color: variant === 'public' ? 'white' : theme.palette.text.primary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  '&:hover': {
                    color: variant === 'public' ? theme.palette.secondary.light : theme.palette.primary.main,
                  },
                }}
              >
                {footerContent.contact.phone}
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: variant === 'public' 
                    ? alpha(theme.palette.common.white, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  transition: theme.transitions.create(['background', 'transform'], {
                    duration: theme.transitions.duration.standard,
                  }),
                  '&:hover': {
                    background: variant === 'public' 
                      ? alpha(theme.palette.common.white, 0.3)
                      : alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Email sx={{ color: variant === 'public' ? 'white' : theme.palette.primary.main }} />
              </Box>
              <Link
                href={`mailto:${footerContent.contact.email}`}
                sx={{
                  color: variant === 'public' ? 'white' : theme.palette.text.primary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  '&:hover': {
                    color: variant === 'public' ? theme.palette.secondary.light : theme.palette.primary.main,
                  },
                }}
              >
                {footerContent.contact.email}
              </Link>
            </Box>
          </Box>

          {/* Resources Section */}
          <Box sx={{ flex: { xs: '1', md: '1' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: variant === 'public' ? 'white' : theme.palette.primary.main,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {footerContent.resources.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {footerContent.resources.links.map((link, index) => (
                <Box
                  key={index}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: variant === 'public' ? 'white' : theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    cursor: 'pointer',
                    transition: theme.transitions.create(['color', 'transform'], {
                      duration: theme.transitions.duration.standard,
                    }),
                    '&:hover': {
                      color: variant === 'public' ? theme.palette.secondary.light : theme.palette.primary.main,
                      transform: 'translateX(8px)',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    '&::before': {
                      content: '""',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: variant === 'public' 
                        ? alpha(theme.palette.common.white, 0.6)
                        : theme.palette.primary.main,
                      mr: 2,
                      transition: theme.transitions.create(['background', 'transform'], {
                        duration: theme.transitions.duration.standard,
                      }),
                    },
                    '&:hover::before': {
                      background: variant === 'public' 
                        ? theme.palette.secondary.light
                        : theme.palette.secondary.main,
                      transform: 'scale(1.2)',
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
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: variant === 'public' ? 'white' : theme.palette.primary.main,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {footerContent.about.title}
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                color: variant === 'public' ? alpha(theme.palette.common.white, 0.9) : theme.palette.text.secondary,
                lineHeight: 1.7,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                mb: 3,
              }}
            >
              {footerContent.about.description}
            </Typography>

            {/* Social Links */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: 40,
                    height: 40,
                    background: variant === 'public' 
                      ? alpha(theme.palette.common.white, 0.1)
                      : alpha(theme.palette.primary.main, 0.1),
                    color: variant === 'public' ? 'white' : theme.palette.primary.main,
                    border: `1px solid ${variant === 'public' 
                      ? alpha(theme.palette.common.white, 0.2)
                      : alpha(theme.palette.primary.main, 0.2)}`,
                    transition: theme.transitions.create(['all'], {
                      duration: theme.transitions.duration.standard,
                    }),
                    '&:hover': {
                      background: variant === 'public' 
                        ? alpha(theme.palette.common.white, 0.2)
                        : alpha(theme.palette.primary.main, 0.2),
                      transform: 'translateY(-2px)',
                      borderColor: variant === 'public' 
                        ? theme.palette.secondary.light
                        : theme.palette.secondary.main,
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
              ? alpha(theme.palette.common.white, 0.2)
              : theme.palette.divider,
            mb: 3,
          }} 
        />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'space-between' },
            gap: { xs: 2, sm: 0 },
            pb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business 
              sx={{ 
                mr: 1, 
                color: variant === 'public' ? 'white' : theme.palette.primary.main,
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
              }} 
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: variant === 'public' ? 'white' : theme.palette.text.primary,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
              }}
            >
              Agency Uptime
            </Typography>
          </Box>
          
          <Typography
            variant="body2"
            sx={{
              color: variant === 'public' ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              textAlign: { xs: 'center', sm: 'right' },
            }}
          >
            © {new Date().getFullYear()} Agency Uptime. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 