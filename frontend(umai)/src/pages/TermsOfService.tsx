import React from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';

const TermsOfService: React.FC = () => {
  const theme = useTheme();

  return (
    <Layout>
      {/* Terms of Service Content */}
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
              Terms of Service
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
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                These Terms of Service ("Terms") govern your use of Agency Uptime ("AU", "we", "us", or "our"), a service owned and operated by Alinea Group, LLC. By using AU, you agree to these Terms. If you do not agree, do not use the service.
              </Typography>
            </Box>

            {/* Section 1: Service Description */}
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
                1. Service Description
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                AU provides website uptime monitoring, AI-powered diagnostics, and white-label reporting for agencies and their clients.
              </Typography>
            </Box>

            {/* Section 2: Eligibility */}
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
                2. Eligibility
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                You must be at least 18 years old and able to form a binding contract to use AU.
              </Typography>
            </Box>

            {/* Section 3: Account Registration */}
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
                3. Account Registration
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                You agree to provide accurate, current, and complete information and to update your information as needed.
              </Typography>
            </Box>

            {/* Section 4: Payment & Refunds */}
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
                4. Payment & Refunds
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: theme.palette.text.secondary }}>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Payment:</strong> Use of AU requires payment as described at checkout or on our website.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Refunds:</strong> We offer a 30-day money-back guarantee from your purchase date.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    After 30 days, all payments are non-refundable.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    <strong>Lifetime or multi-year deals:</strong> If you purchased a "lifetime" or multi-year license, this refers to at least 10 years of service from your purchase date.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Section 5: User Responsibilities */}
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
                5. User Responsibilities
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                You are responsible for maintaining the security of your account and monitoring credentials. Do not use AU for any illegal, abusive, or unauthorized purpose.
              </Typography>
            </Box>

            {/* Section 6: Service Availability */}
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
                6. Service Availability
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                While we strive for continuous uptime, we do not guarantee that AU will always be available, error-free, or secure.
              </Typography>
            </Box>

            {/* Section 7: Limitation of Liability */}
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
                7. Limitation of Liability
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                To the maximum extent permitted by law, Alinea Group, LLC and AU's total liability to you for any claims arising out of or relating to your use of the service is limited to the total amount you have paid us for the service.
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We are not liable for indirect, incidental, special, consequential, or punitive damages, or for any lost profits, revenues, data, or business opportunities.
              </Typography>
            </Box>

            {/* Section 8: Indemnification */}
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
                8. Indemnification
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                You agree to indemnify and hold harmless Alinea Group, LLC, its affiliates, officers, and employees from any claims, damages, or expenses resulting from your use of AU or violation of these Terms.
              </Typography>
            </Box>

            {/* Section 9: Termination */}
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
                9. Termination
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We may suspend or terminate your access to AU at any time if you violate these Terms or use the service in a way that may harm us or others. You may cancel your account at any time.
              </Typography>
            </Box>

            {/* Section 10: Modifications to the Service or Terms */}
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
                10. Modifications to the Service or Terms
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                We may modify these Terms or the AU service at any time. If changes are material, we will provide notice. Continued use of the service constitutes acceptance of any changes.
              </Typography>
            </Box>

            {/* Section 11: Governing Law */}
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
                11. Governing Law
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                These Terms are governed by the laws of the State of Florida, without regard to its conflict of law principles. Any disputes will be resolved in the courts of Florida.
              </Typography>
            </Box>

            {/* Section 12: Contact Us */}
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
                12. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 3 }}>
                For questions about these Terms, please contact us at:
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
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default TermsOfService; 