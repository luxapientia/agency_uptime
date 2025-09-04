import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  Email as EmailIcon, 
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from '../../lib/axios';
import { showToast } from '../../utils/toast';

const emailValidationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const verificationValidationSchema = Yup.object({
  verificationCode: Yup.string()
    .required('Verification code is required')
    .length(6, 'Verification code must be 6 digits'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  const emailFormik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: emailValidationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      try {
        // Send verification code using the same endpoint as NotificationSettings
        await axios.post('/auth/send-verification', { email: values.email });
        
        setUserEmail(values.email);
        setMessage('Verification code sent to your email. Please check your inbox.');
        setStep(1);
        showToast.success('Verification code sent to your email');
        
      } catch (error) {
        const errorMessage = 'Failed to send verification code. Please try again.';
        setError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const verificationFormik = useFormik({
    initialValues: {
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: verificationValidationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      try {
        // Reset password using the new API endpoint
        await axios.post('/auth/reset-password', {
          email: userEmail,
          verificationCode: values.verificationCode,
          newPassword: values.newPassword
        });
        
        setMessage('Password reset successfully! You can now sign in with your new password.');
        setStep(2);
        showToast.success('Password reset successfully!');
        
      } catch (error) {
        const errorMessage = (error as any)?.response?.data?.error || 'Failed to reset password. Please try again.';
        setError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleBackToEmail = () => {
    setStep(0);
    setError(null);
    setMessage(null);
    verificationFormik.resetForm();
  };

  const handleResendCode = async () => {
    setVerificationLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Use the same resend logic as NotificationSettings
      await axios.post('/auth/send-verification', { email: userEmail });
      
      setMessage('Verification code resent to your email.');
      showToast.success('Verification code resent to your email');
      
    } catch (error) {
      const errorMessage = 'Failed to resend verification code. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const steps = ['Enter Email', 'Verify & Reset', 'Complete'];

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Back to Login Link */}
          <Box sx={{ alignSelf: 'flex-start', mb: 2 }}>
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
              <Typography variant="body2">Back to Login</Typography>
            </Link>
          </Box>

          {/* Progress Stepper */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {step === 0 && (
              <EmailIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main', 
                  mb: 2 
                }} 
              />
            )}
            {step === 1 && (
              <SecurityIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main', 
                  mb: 2 
                }} 
              />
            )}
            {step === 2 && (
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'success.main', 
                  mb: 2 
                }} 
              />
            )}
            
            <Typography component="h1" variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {step === 0 && 'Forgot Password?'}
              {step === 1 && 'Enter Verification Code'}
              {step === 2 && 'Password Reset Complete!'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              {step === 0 && "No worries! Enter your email address and we'll send you a verification code."}
              {step === 1 && `Enter the 6-digit verification code sent to ${userEmail} and your new password.`}
              {step === 2 && 'Your password has been successfully reset. You can now sign in with your new password.'}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {message && (
            <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
              {message}
            </Alert>
          )}

          {/* Step 0: Email Form */}
          {step === 0 && (
            <form onSubmit={emailFormik.handleSubmit} style={{ width: '100%' }}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={emailFormik.values.email}
                onChange={emailFormik.handleChange}
                error={emailFormik.touched.email && Boolean(emailFormik.errors.email)}
                helperText={emailFormik.touched.email && emailFormik.errors.email}
                disabled={isLoading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !emailFormik.isValid}
                sx={{ mb: 3 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </Button>
            </form>
          )}

          {/* Step 1: Verification & Password Form */}
          {step === 1 && (
            <form onSubmit={verificationFormik.handleSubmit} style={{ width: '100%' }}>
              <TextField
                fullWidth
                id="verificationCode"
                name="verificationCode"
                label="Verification Code"
                value={verificationFormik.values.verificationCode}
                onChange={verificationFormik.handleChange}
                error={verificationFormik.touched.verificationCode && Boolean(verificationFormik.errors.verificationCode)}
                helperText={verificationFormik.touched.verificationCode && verificationFormik.errors.verificationCode}
                disabled={isLoading}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 6 }}
                placeholder="123456"
              />

              <TextField
                fullWidth
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                value={verificationFormik.values.newPassword}
                onChange={verificationFormik.handleChange}
                error={verificationFormik.touched.newPassword && Boolean(verificationFormik.errors.newPassword)}
                helperText={verificationFormik.touched.newPassword && verificationFormik.errors.newPassword}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={verificationFormik.values.confirmPassword}
                onChange={verificationFormik.handleChange}
                error={verificationFormik.touched.confirmPassword && Boolean(verificationFormik.errors.confirmPassword)}
                helperText={verificationFormik.touched.confirmPassword && verificationFormik.errors.confirmPassword}
                disabled={isLoading}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !verificationFormik.isValid}
                sx={{ mb: 2 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  onClick={handleBackToEmail}
                  disabled={isLoading || verificationLoading}
                  sx={{ textTransform: 'none' }}
                >
                  Back to Email
                </Button>
                <Button
                  onClick={handleResendCode}
                  disabled={isLoading || verificationLoading}
                  sx={{ textTransform: 'none' }}
                  startIcon={verificationLoading ? <CircularProgress size={16} /> : null}
                >
                  {verificationLoading ? 'Sending...' : 'Resend Code'}
                </Button>
              </Box>
            </form>
          )}

          {/* Step 2: Success */}
          {step === 2 && (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mb: 2 }}
              >
                Sign In Now
              </Button>
            </Box>
          )}

          {/* Additional Help */}
          {step !== 2 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Remember your password?
              </Typography>
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in instead
              </Link>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
} 