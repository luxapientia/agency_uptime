import React from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';

const FAQ: React.FC = () => {
  const theme = useTheme();

  return (
    <Layout>
      {/* FAQ Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Box
                component="span"
                sx={{
                  width: 24,
                  height: 24,
                  background: theme.palette.grey[400],
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&::before': {
                    content: '""',
                    width: 12,
                    height: 12,
                    background: 'white',
                    borderRadius: '50%',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 6,
                      height: 6,
                      background: theme.palette.grey[400],
                      borderRadius: '50%',
                    },
                  },
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                }}
              >
                Agency Uptime – Frequently Asked Questions
              </Typography>
            </Box>
          </Box>

          {/* FAQ Content */}
          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            {/* Question 1 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                1. What exactly does Agency Uptime do?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Agency Uptime is a white-labeled website monitoring platform designed for digital agencies. It checks your clients' websites every 5 minutes to 30 seconds (depending on plan), notifies you instantly if a site goes down, and sends branded uptime reports, all under your own domain and branding.
              </Typography>
            </Box>

            {/* Question 2 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                2. Can I use my own domain and logo?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Yes, with the Agency and the Enterprise plan. You can fully white-label the platform, custom domain, logo, colors, email templates, and even client-facing dashboards. Your clients will never see our name.
              </Typography>
            </Box>

            {/* Question 3 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                3. How many sites can I monitor?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Up to 200 sites for $199/month. This gives agencies plenty of capacity for all their clients plus room for prospect monitoring and competitor tracking without hitting limits.
              </Typography>
            </Box>

            {/* Question 4 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                4. What kind of monitoring is included?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                We check HTTP/HTTPS status codes and monitor SSL certificate expiry. If a site fails multiple checks, we notify you immediately.
              </Typography>
            </Box>

            {/* Question 5 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                5. Do you offer global monitoring?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Yes. We have several overseas monitoring servers.
              </Typography>
            </Box>

            {/* Question 6 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                6. How do alerts work?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                You'll get instant alerts via email, Slack, webhooks, or mobile push (via Go High Level's LeadConnector app). No SMS, too costly and too much compliance risk.
              </Typography>
            </Box>

            {/* Question 7 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                7. Can I send uptime reports to clients?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Yes. We generate branded PDF reports automatically each month, or on demand. These showcase uptime %, downtime incidents, and response times. Great for retention.
              </Typography>
            </Box>

            {/* Question 8 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                8. Can I charge my clients for this?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Hell yes, and you should. Most agencies charge $75-$200 per month per site for "AI Website Protection Monitoring." This is your high-margin upsell with near-zero operational cost.
              </Typography>
            </Box>

            {/* Question 9 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                9. Does this integrate with GoHighLevel?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Natively. We support mobile push alerts through LeadConnector, and webhook support means you can plug uptime events into any GHL workflow.
              </Typography>
            </Box>

            {/* Question 10 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                10. Is there a free trial?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Yes. 14 days, full feature access, no credit card required. Kick the tires and see how fast you can add recurring revenue to your agency.
              </Typography>
            </Box>

            {/* Question 11 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                11. What happens if I go over 200 sites?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                We'll reach out to discuss options. For agencies legitimately growing beyond 200 sites, we offer custom enterprise plans with volume pricing that still maintain great margins.
              </Typography>
            </Box>

            {/* Question 12 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                12. Is this secure and reliable?
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Yes. We use containerized monitoring infrastructure, queue-based alerting, and battle-tested architecture. Your agency data is tenant-isolated and encrypted.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default FAQ; 