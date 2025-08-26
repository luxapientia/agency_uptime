import React from 'react';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';

// FAQ Data Structure
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  color: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    question: "What happens after my 10-year deal expires?",
    answer: "Existing lifetime customers are offered a deeply discounted renewal option. Coverage is guaranteed until 2035, with no forced upgrades, surprise fees, or service interruptions. Monitoring will continue as promised for the full decade.",
    color: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"
  },
  {
    id: 2,
    question: "Does this include ALL features, or are there hidden costs?",
    answer: "All plans include listed features with zero hidden costs. Features common to all plans: AI diagnostics and root cause analysis, US-based support, data export. Starter ($97): Email & SMS alerts. Professional ($197): Predictive monitoring, Slack & Discord alerts. Enterprise ($297): Advanced predictive AI, DNS & SSL monitoring. No paid add-ons or surprise fees.",
    color: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)"
  },
  {
    id: 3,
    question: "How is this different from Pingdom, UptimeRobot, or other monitoring tools?",
    answer: "Traditional tools provide basic \"site down\" alerts. UptimeMonitoring.AI uses artificial intelligence to: diagnose the root cause (e.g., database issues, server overload), explain why it happened (e.g., recent deployment, traffic spike), provide specific fix instructions (e.g., restart service, increase memory), and predict problems before outages occur (available in Professional and Enterprise plans). The pricing model is a one-time payment, contrasting with competitors' $7-15/month subscriptions.",
    color: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
  },
  {
    id: 4,
    question: "What if I need to cancel or get my money back?",
    answer: "A 30-day money-back guarantee is offered, no questions asked. After 30 days, there's no subscription to cancel; users own their monitoring for 10 years. Users can export all their data anytime, ensuring no vendor lock-in.",
    color: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
  },
  {
    id: 5,
    question: "Is the AI actually reliable, or is this just marketing hype?",
    answer: "The AI is trained on millions of website incidents and continuously learns from real-world data. It correctly identifies root causes in 87% of incidents and reduces average resolution time by 73%. The AI improves over time by processing more incidents. Raw monitoring data is always provided, with AI insights being an addition, not a replacement, for traditional metrics.",
    color: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
  },
  {
    id: 6,
    question: "What are the technical limits of each plan?",
    answer: "Starter ($97): 3 sites, 5-minute checks, AI diagnostics, email/SMS alerts. Professional ($197): 5 sites, 1-minute checks, advanced AI diagnostics, predictive monitoring, Slack/Discord alerts. Enterprise ($297): 10 sites, 30-second checks, enterprise AI diagnostics, advanced predictive AI, DNS/SSL monitoring. All plans include unlimited alerts, unlimited team members, and core AI diagnostic features. No bandwidth limits or hidden restrictions.",
    color: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"
  },
  {
    id: 7,
    question: "Can I monitor more sites later if my business grows?",
    answer: "Yes, users can upgrade to a higher plan by paying the difference (e.g., an additional $100 to upgrade from Starter to Professional). The 10-year timeline remains the same. Additional site add-ons are available for existing lifetime customers at special rates.",
    color: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
  },
  {
    id: 8,
    question: "What kind of websites and applications can you monitor?",
    answer: "Any website, web application, API endpoint, or online service accessible via HTTP/HTTPS. Examples include: E-commerce stores (Shopify, WooCommerce, custom), SaaS applications and dashboards, APIs and webhooks, WordPress sites and blogs, Landing pages and marketing sites, Web apps and progressive web apps. The AI is trained on common issues across all these platforms.",
    color: "linear-gradient(135deg, #10B981 0%, #047857 100%)"
  },
  {
    id: 9,
    question: "Do you provide customer support, and for how long?",
    answer: "US-based email support is provided for the full 10 years of the plan. Responses are typically within 24 hours (often faster). Comprehensive documentation and video tutorials are maintained. Lifetime customers are considered long-term partners.",
    color: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"
  },
  {
    id: 10,
    question: "Is this offer really limited, or just fake scarcity?",
    answer: "It is a genuine limited-time offer. Lifetime deals are capped to ensure quality service. Once the limit is reached or funding goals are achieved, lifetime pricing ends, and the service switches to standard monthly subscriptions. Lifetime Deal (LTD) buyers get grandfathered pricing and features forever. New customers after the offer closes will pay monthly rates similar to competitors ($15-50/month).",
    color: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)"
  }
];

// FAQ Item Component
const FAQItem: React.FC<{ item: FAQItem }> = ({ item }) => (
  <Box 
    sx={{ 
      mb: 6,
      background: 'white',
      borderRadius: '20px',
      p: 4,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: item.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.1rem',
          flexShrink: 0,
        }}
      >
        {item.id}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
          {item.question}
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.7, fontSize: '1.1rem' }}>
          {item.answer}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const FAQ: React.FC = () => {
  return (
    <Layout>
      {/* FAQ Section */}
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
          background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '40%',
          background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
        },
      }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              UptimeMonitoring.AI - Frequently Asked Questions
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748B',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Everything you need to know about our AI-powered uptime monitoring service
            </Typography>
          </Box>

          {/* FAQ Content */}
          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
            {FAQ_DATA.map((faqItem) => (
              <FAQItem key={faqItem.id} item={faqItem} />
            ))}
          </Box>
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default FAQ; 