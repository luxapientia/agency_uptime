import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../lib/axios';
import type { MembershipPlan } from '../../types/membership.types';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface BundlePaymentModalProps {
  open: boolean;
  onClose: () => void;
  plans: MembershipPlan[];
  bundlePrice: number;
  totalPrice: number;
  savings: number;
  onPaymentSuccess: () => void;
}

interface BundlePaymentFormProps {
  plans: MembershipPlan[];
  bundlePrice: number;
  totalPrice: number;
  savings: number;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const BundlePaymentForm: React.FC<BundlePaymentFormProps> = ({
  plans,
  bundlePrice,
  totalPrice,
  savings,
  clientSecret,
  onSuccess,
  onError,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First, submit the elements to validate the form
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'Please check your payment details.');
        return;
      }

      // Then confirm the payment with Stripe using the provided client secret
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/membership-plans`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Bundle Payment Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete your subscription to all premium plans
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto',
              },
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || isProcessing}
          startIcon={
            isProcessing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <CreditCardIcon />
            )
          }
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
            },
          }}
        >
          {isProcessing ? 'Processing...' : `Pay $${bundlePrice}`}
        </Button>
      </Box>
    </Box>
  );
};

const BundlePaymentModal: React.FC<BundlePaymentModalProps> = ({
  open,
  onClose,
  plans,
  bundlePrice,
  totalPrice,
  savings,
  onPaymentSuccess,
}) => {
  const theme = useTheme();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
      setPaymentStatus('pending');
      setError(null);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentStatus('error');
  };

  const handleClose = () => {
    if (paymentStatus === 'pending') {
      onClose();
    }
    // Reset state when closing
    setClientSecret(null);
    setPaymentStatus('pending');
    setError(null);
    setIsLoading(false);
  };

  // Create payment intent when modal opens
  useEffect(() => {
    if (open && plans.length > 0 && !clientSecret) {
      const createPaymentIntent = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post('/payment/create-payment-intent', {
            planId: plans[0].id, // Use first plan as reference, backend will handle bundle logic
            amount: bundlePrice * 100, // Convert to cents for Stripe
            isBundle: true,
            planIds: plans.map(plan => plan.id),
          });
          setClientSecret(response.data.clientSecret);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to initialize payment');
          setPaymentStatus('error');
        } finally {
          setIsLoading(false);
        }
      };

      createPaymentIntent();
    }
  }, [open, plans, bundlePrice, clientSecret]);

  if (plans.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Bundle Payment
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <AnimatePresence mode="wait">
          {paymentStatus === 'pending' && (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Bundle Summary */}
              <Box
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  border: `2px solid ${theme.palette.success.main}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    All Plans Bundle
                  </Typography>
                  <Chip
                    label={`Save $${savings}/month`}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Individual Plans Total
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${totalPrice}/month
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      ${bundlePrice}/month
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      Bundle Price
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Get access to all premium features and save ${savings} per month!
                </Typography>
              </Box>

              {/* Plans List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Included Plans:
                </Typography>
                <List dense>
                  {plans.map((plan) => (
                    <ListItem key={plan.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <StarIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={plan.title}
                        secondary={plan.description}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      <Chip
                        label={`$${plan.price}/month`}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Security Notice */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  mb: 2,
                  borderRadius: 1,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <SecurityIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  Your payment is secured by Stripe
                </Typography>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <BundlePaymentForm
                    plans={plans}
                    bundlePrice={bundlePrice}
                    totalPrice={totalPrice}
                    savings={savings}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onClose={onClose}
                  />
                </Elements>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="error">
                    Failed to initialize payment. Please try again.
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}

          {paymentStatus === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon
                  sx={{
                    fontSize: 64,
                    color: 'success.main',
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold" color="success.main">
                  Bundle Payment Successful!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your subscription to all premium plans has been activated.
                </Typography>
              </Box>
            </motion.div>
          )}

          {paymentStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ErrorIcon
                  sx={{
                    fontSize: 64,
                    color: 'error.main',
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold" color="error.main">
                  Payment Failed
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {error || 'There was an issue processing your payment.'}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setPaymentStatus('pending')}
                  startIcon={<CreditCardIcon />}
                >
                  Try Again
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BundlePaymentModal; 