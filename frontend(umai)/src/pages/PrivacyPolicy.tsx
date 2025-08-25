import React from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';

const PrivacyPolicy: React.FC = () => {
  const theme = useTheme();

  return (
    <Layout>
      {/* Privacy Policy Content */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 2,
              }}
            >
              Privacy Policy
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '1rem', sm: '1.125rem' },
              }}
            >
              Effective Date: July 29, 2025
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ maxWidth: '800px', mx: 'auto', textAlign: 'left' }}>
            {/* Introduction */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Introduction
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                Agency Uptime ('AU', 'we', 'us', or 'our') is a service owned and operated by Alinea Group, LLC. We are committed to protecting your privacy and ensuring the security of your information. This Privacy Policy explains how we collect, use, store, and share information when you use our website and services.
              </Typography>
            </Box>

            {/* Information We Collect */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Information We Collect
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                We collect information to provide better services to all our users. The types of information we collect include:
              </Typography>

              {/* 1. Information You Provide to Us */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  }}
                >
                  1. Information You Provide to Us
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Account Information:</strong> When you sign up, we collect your name, email address, and other contact details.
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Billing Information:</strong> If you purchase a paid plan, we collect payment and billing information (handled securely by our payment processor).
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Customer Support:</strong> If you contact us, we collect information you provide in the correspondence.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 2. Information We Collect Automatically */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  }}
                >
                  2. Information We Collect Automatically
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Usage Data:</strong> We collect information about your use of Agency Uptime, including monitored URLs, uptime status, and alert history.
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to provide and improve our services.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 3. Information from Third Parties */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  }}
                >
                  3. Information from Third Parties
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                  <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      <strong>Integrations:</strong> If you connect third-party services (e.g., Slack, Discord, or SMS providers), we collect information necessary to provide those integrations.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* How We Use Information */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                How We Use Information
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                We use the information we collect to:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Provide, operate, and maintain our services
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Notify you of outages and send relevant alerts
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Improve and personalize the AU experience
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Process payments and manage subscriptions
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Respond to support requests and communicate with you
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Maintain security, prevent fraud, and enforce our Terms of Service
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Information Sharing */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Information Sharing
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                We do not sell your personal information. We may share information as follows:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Service Providers:</strong> With trusted vendors (e.g., payment processors, hosting providers) who help us operate AU
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Legal Compliance:</strong> If required by law, subpoena, or government request
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, information may be transferred as part of the transaction
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Data Security */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Data Security
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We use industry-standard security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </Typography>
            </Box>

            {/* Data Retention */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Data Retention
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We retain your information as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
              </Typography>
            </Box>

            {/* Your Rights */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Your Rights
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                Depending on your jurisdiction, you may have the right to:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary, mb: 3 }}>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Access, update, or delete your personal information
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Object to or restrict certain processing
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Withdraw consent at any time (where processing is based on consent)
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                To exercise these rights, contact us at{' '}
                <Box
                  component="a"
                  href="mailto:support@agencyuptime.com"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                    '&:hover': {
                      textDecoration: 'none',
                    },
                  }}
                >
                  support@agencyuptime.com
                </Box>
                .
              </Typography>
            </Box>

            {/* Children's Privacy */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Children's Privacy
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                AU is not intended for children under 16. We do not knowingly collect information from children under 16. If we become aware of such data, we will delete it promptly.
              </Typography>
            </Box>

            {/* Changes to This Policy */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Changes to This Policy
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Your continued use of AU after changes are posted constitutes acceptance of the revised policy.
              </Typography>
            </Box>

            {/* Contact Us */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                If you have questions or concerns about this Privacy Policy, please contact us:
              </Typography>
              <Box sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Alinea Group, LLC
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <Box
                    component="a"
                    href="mailto:support@agencyuptime.com"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'underline',
                      '&:hover': {
                        textDecoration: 'none',
                      },
                    }}
                  >
                    support@agencyuptime.com
                  </Box>
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  P.O. Box 1281
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  St. Petersburg, FL 33731
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default PrivacyPolicy; 