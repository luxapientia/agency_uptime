import React from 'react';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';

// Terms of Service Data Structure
interface TermsSection {
  id: number;
  title: string;
  content: string | string[];
  type: 'text' | 'list';
}

const TERMS_DATA: TermsSection[] = [
  {
    id: 1,
    title: "Service Description",
    content: "UMAI provides website uptime monitoring and AI-powered incident diagnostics via our website and related integrations.",
    type: 'text'
  },
  {
    id: 2,
    title: "Eligibility",
    content: "You must be at least 18 years old and able to form a binding contract to use UMAI.",
    type: 'text'
  },
  {
    id: 3,
    title: "Account Registration",
    content: "You agree to provide accurate, current, and complete information and to update your information as needed.",
    type: 'text'
  },
  {
    id: 4,
    title: "Payment & Refunds",
    content: [
      "Payment: Use of UMAI requires payment as described at checkout or on our website.",
      "Refunds: A 30-day money-back guarantee is offered from the purchase date.",
      "After 30 days, all payments are non-refundable.",
      "Lifetime deals: If a \"lifetime\" or multi-year license is purchased, this refers to at least 10 years of service from the purchase date."
    ],
    type: 'list'
  },
  {
    id: 5,
    title: "User Responsibilities",
    content: "You are responsible for maintaining the security of your account and monitoring credentials. You must not use UMAI for any illegal, abusive, or unauthorized purpose.",
    type: 'text'
  },
  {
    id: 6,
    title: "Service Availability",
    content: "While UMAI strives for continuous uptime, it does not guarantee that UMAI will always be available, error-free, or secure.",
    type: 'text'
  },
  {
    id: 7,
    title: "Limitation of Liability",
    content: [
      "To the maximum extent permitted by law, Alinea Group, LLC and UMAI's total liability for any claims arising from the use of the service is limited to the total amount paid for the service.",
      "We are not liable for indirect, incidental, special, consequential, or punitive damages, or for any lost profits, revenues, data, or business opportunities."
    ],
    type: 'list'
  },
  {
    id: 8,
    title: "Indemnification",
    content: "You agree to indemnify and hold harmless Alinea Group, LLC, its affiliates, officers, and employees from any claims, damages, or expenses resulting from your use of UMAI or violation of these Terms.",
    type: 'text'
  },
  {
    id: 9,
    title: "Termination",
    content: "UMAI may suspend or terminate access at any time if Terms are violated or if the service is used in a way that may harm us or others. You may cancel your account at any time.",
    type: 'text'
  },
  {
    id: 10,
    title: "Modifications to the Service or Terms",
    content: "UMAI may modify these Terms or the service at any time. Material changes will be noticed. Continued use of the service constitutes acceptance of any changes.",
    type: 'text'
  },
  {
    id: 11,
    title: "Governing Law",
    content: "These Terms are governed by the laws of the State of Florida, without regard to its conflict of law principles. Any disputes will be resolved in the courts of Florida.",
    type: 'text'
  }
];

// Terms Section Component
const TermsSection: React.FC<{ section: TermsSection }> = ({ section }) => (
  <Box sx={{ mb: 6 }}>
    <Typography
      variant="h5"
      sx={{
        fontWeight: 700,
        mb: 3,
        color: '#1E293B',
        fontSize: { xs: '1.25rem', sm: '1.5rem' },
      }}
    >
      {section.id}. {section.title}
    </Typography>
    
    {section.type === 'text' ? (
      <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.7 }}>
        {section.content as string}
      </Typography>
    ) : (
      <Box component="ul" sx={{ pl: 3, color: '#64748B' }}>
        {(section.content as string[]).map((item, index) => (
          <Box component="li" key={index} sx={{ mb: 1, lineHeight: 1.6 }}>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

const TermsOfService: React.FC = () => {

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
                color: '#1E293B',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 2,
              }}
            >
              Terms of Service
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748B',
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
              <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.7 }}>
                These Terms of Service ("Terms") govern your use of UptimeMonitoring.AI ("UMAI", "we", "us", or "our"), a service owned and operated by Alinea Group, LLC. By using UMAI, you agree to these Terms. If you do not agree, do not use the service.
              </Typography>
            </Box>

            {/* Terms Sections */}
            {TERMS_DATA.map((section) => (
              <TermsSection key={section.id} section={section} />
            ))}

            {/* Contact Us Section */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: '#1E293B',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                12. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.7, mb: 3 }}>
                For questions about these Terms, please contact us at:
              </Typography>
              <Box sx={{ color: '#64748B', lineHeight: 1.7 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Alinea Group, LLC
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <Box
                    component="a"
                    href="mailto:support@uptimemonitoring.ai"
                    sx={{
                      color: '#3B82F6',
                      textDecoration: 'underline',
                      '&:hover': {
                        textDecoration: 'none',
                      },
                    }}
                  >
                    support@uptimemonitoring.ai
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