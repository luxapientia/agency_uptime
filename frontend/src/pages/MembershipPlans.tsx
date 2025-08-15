import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
  Paper,
  alpha,
} from '@mui/material';
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Psychology as PsychologyIcon,
  PictureAsPdf as PdfIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import type { AppDispatch, RootState } from '../store';
import { fetchMembershipPlans, fetchUserMemberships } from '../store/slices/membershipSlice';
import type { MembershipPlan } from '../types/membership.types';
import StripePaymentModal from '../components/payment/StripePaymentModal';
import BundlePaymentModal from '../components/payment/BundlePaymentModal';
import { getFeatureDescription, isValidFeatureKey } from '../utils/featureUtils';

interface PlanCardProps {
    plan: MembershipPlan;
    isPopular?: boolean;
    delay: number;
    onSelect: (plan: MembershipPlan) => void;
    isSelected?: boolean;
    isActive?: boolean;
    endDate?: Date | null;
    disabled?: boolean;
    disabledReason?: string;
}

const PlanCard = ({ plan, isPopular = false, delay, onSelect, isSelected, isActive = false, endDate, disabled = false, disabledReason }: PlanCardProps) => {
    const theme = useTheme();
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const [isHovered, setIsHovered] = useState(false);

    // Helper function to format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getPlanIcon = (planName: string) => {
        switch (planName.toLowerCase()) {
            case 'starter':
                return <StarIcon />;
            case 'professional':
                return <TrendingUpIcon />;
            case 'enterprise':
                return <SecurityIcon />;
            case 'branded pdf reports':
                return <PdfIcon />;
            case 'multi-user logins':
                return <GroupIcon />;
            case '60-second checks':
            case '30-second checks':
                return <ScheduleIcon />;
            case 'webhook & api access':
                return <ApiIcon />;
            case 'predictive monitoring':
                return <PsychologyIcon />;
            default:
                return <StarIcon />;
        }
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card
                sx={{
                    height: '100%',
                    minHeight: 480, // Ensure consistent minimum height
                    position: 'relative',
                    background: isPopular
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: isSelected
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    transition: theme.transitions.create(
                        ['transform', 'box-shadow', 'border-color'],
                        { duration: theme.transitions.duration.shorter }
                    ),
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
                    boxShadow: isHovered
                        ? `0 12px 24px -8px ${alpha(theme.palette.primary.main, 0.3)}`
                        : `0 4px 12px -2px ${alpha(theme.palette.divider, 0.1)}`,
                    cursor: 'pointer',
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                // Card click removed - only button triggers payment
            >
                {isPopular && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1,
                        }}
                    >
                        <Chip
                            icon={<StarIcon />}
                            label="Most Popular"
                            color="primary"
                            sx={{
                                fontWeight: 'bold',
                                boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                        />
                    </Box>
                )}

                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Stack spacing={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Plan Header */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    color: 'white',
                                    mb: 2,
                                }}
                            >
                                {getPlanIcon(plan.name)}
                            </Box>

                            <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                                {plan.title}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {plan.description}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Price */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h3" component="div" fontWeight="bold" color="primary">
                                ${plan.price}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                per month
                            </Typography>
                        </Box>

                        {/* Features */}
                        {plan.features && plan.features.length > 0 && (
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Features:
                                </Typography>
                                <Stack spacing={1}>
                                    {plan.features.map((feature, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    backgroundColor: theme.palette.success.main,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 1,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white',
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                                                {isValidFeatureKey(feature) ? getFeatureDescription(feature) : feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Membership Status - Always render to maintain consistent height */}
                        <Box sx={{ textAlign: 'center', mb: 2, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isActive && endDate ? (
                                <Chip
                                    label={`Active until ${formatDate(endDate)}`}
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            ) : (
                                <Box sx={{ height: 32 }} />
                            )}
                        </Box>

                        {/* Action Button */}
                        <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Button
                                variant={isActive ? "outlined" : "contained"}
                                size="large"
                                fullWidth
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(plan);
                                }}
                                disabled={isActive || disabled}
                                sx={{
                                    fontWeight: 'bold',
                                    py: 1.5,
                                    ...(isActive ? {
                                        borderColor: theme.palette.success.main,
                                        color: theme.palette.success.main,
                                        '&:hover': {
                                            borderColor: theme.palette.success.dark,
                                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                                        },
                                    } : disabled ? {
                                        borderColor: theme.palette.grey[400],
                                        color: theme.palette.grey[400],
                                        backgroundColor: theme.palette.grey[100],
                                        '&:hover': {
                                            borderColor: theme.palette.grey[400],
                                            backgroundColor: theme.palette.grey[100],
                                        },
                                    } : {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                        },
                                    }),
                                }}
                            >
                                {isActive ? 'Current Plan' : disabled ? disabledReason || 'Unavailable' : 'Subscribe Now'}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default function MembershipPlans() {
    const dispatch = useDispatch<AppDispatch>();
    const { plans, bundlePrice, totalPrice, savings, userMemberships, isLoading, error } = useSelector((state: RootState) => state.membership);
    const theme = useTheme();
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showBundlePaymentModal, setShowBundlePaymentModal] = useState(false);

    useEffect(() => {
        dispatch(fetchMembershipPlans());
        dispatch(fetchUserMemberships());
    }, [dispatch]);

    const handlePlanSelect = (plan: MembershipPlan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        // Refresh user memberships after successful payment
        dispatch(fetchUserMemberships());
        setShowPaymentModal(false);
        setSelectedPlan(null);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
    };

    const handleBundlePayment = () => {
        setShowBundlePaymentModal(true);
    };

    const handleCloseBundlePaymentModal = () => {
        setShowBundlePaymentModal(false);
    };

    // Helper function to check if user has an active membership for a plan
    const isPlanActive = (planId: string) => {
        const now = new Date();
        return userMemberships.some(membership => 
            membership.membershipPlanId === planId && 
            new Date(membership.endDate) > now
        );
    };

    // Helper function to get membership end date for a plan
    const getMembershipEndDate = (planId: string) => {
        const membership = userMemberships.find(m => m.membershipPlanId === planId);
        return membership ? new Date(membership.endDate) : null;
    };

    // Helper function to format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const isPlanSelected = (plan: MembershipPlan) => {
        return selectedPlan?.id === plan.id;
    };

    // Separate main plans and upgrade plans
    const mainPlans = plans.filter(plan => plan.type === 'main');
    const upgradePlans = plans.filter(plan => plan.type === 'upgrade');

    // Check if user has any active main plan
    const hasActiveMainPlan = mainPlans.some(plan => isPlanActive(plan.id));
    
    // Get the active main plan (user can only have one)
    const activeMainPlan = mainPlans.find(plan => isPlanActive(plan.id));

    // Check if all upgrade plans are purchased
    const allUpgradePlansPurchased = upgradePlans.length > 0 && upgradePlans.every(plan => isPlanActive(plan.id));

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                        }}
                    >
                        Choose Your Plan
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                        Select the perfect plan for your agency's monitoring needs
                    </Typography>
                </Box>
            </motion.div>

            {/* Current Memberships */}
            {userMemberships.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                        Your Current Memberships
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Plans you're currently subscribed to
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 6 }}>
                        {userMemberships
                            .filter(membership => new Date(membership.endDate) > new Date())
                            .map((membership) => (
                                <Chip
                                    key={membership.id}
                                    label={`${membership.membershipPlan.title} - Expires ${formatDate(new Date(membership.endDate))}`}
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            ))}
                    </Box>
                </motion.div>
            )}

            {/* Main Plans */}
            {mainPlans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                            {hasActiveMainPlan ? 'Your Main Plan' : 'Choose Your Main Plan'}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            {hasActiveMainPlan 
                                ? `You are currently subscribed to the ${activeMainPlan?.title} plan`
                                : 'Start with a main plan to unlock monitoring features'
                            }
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {hasActiveMainPlan 
                                ? 'You can only have one main plan at a time. Contact support to change plans.'
                                : 'Select a main plan to get started with website monitoring. You can add upgrade plans later.'
                            }
                        </Typography>
                        {hasActiveMainPlan && activeMainPlan && (
                            <Alert 
                                severity="success" 
                                sx={{ mt: 3, borderRadius: 2, maxWidth: 600, mx: 'auto' }}
                            >
                                <Typography variant="body2">
                                    <strong>Active Plan:</strong> {activeMainPlan.title} - ${activeMainPlan.price}/month
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 3,
                            mb: 6
                        }}
                    >
                        {mainPlans.map((plan, index) => (
                            <Box
                                key={plan.id}
                                sx={{
                                    flex: '1 1 320px',
                                    maxWidth: 380,
                                    minWidth: 320
                                }}
                            >
                                <PlanCard
                                    plan={plan}
                                    isPopular={plan.name === 'Agency'}
                                    delay={index * 0.1}
                                    onSelect={handlePlanSelect}
                                    isSelected={isPlanSelected(plan)}
                                    isActive={isPlanActive(plan.id)}
                                    endDate={getMembershipEndDate(plan.id)}
                                    disabled={hasActiveMainPlan && !isPlanActive(plan.id)}
                                    disabledReason={hasActiveMainPlan && !isPlanActive(plan.id) ? "One Main Plan Only" : undefined}
                                />
                            </Box>
                        ))}
                    </Box>
                </motion.div>
            )}

            {/* Upgrade Plans */}
            {upgradePlans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                            Upgrade Plans
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            {hasActiveMainPlan 
                                ? 'Enhance your monitoring with these powerful add-ons'
                                : 'Unlock additional features after subscribing to a main plan'
                            }
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {hasActiveMainPlan 
                                ? 'Add these features to your existing monitoring setup'
                                : 'You need to subscribe to a main plan first to access these upgrades'
                            }
                        </Typography>
                    </Box>

                    {!hasActiveMainPlan && (
                        <Alert 
                            severity="info" 
                            sx={{ mb: 4, borderRadius: 2 }}
                        >
                            <Typography variant="body2">
                                <strong>Note:</strong> You need to subscribe to a main plan first before you can purchase upgrade plans. 
                                This ensures you have the basic monitoring infrastructure in place.
                            </Typography>
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 3,
                            mb: 6,
                            opacity: hasActiveMainPlan ? 1 : 0.6
                        }}
                    >
                        {upgradePlans.map((plan, index) => (
                            <Box
                                key={plan.id}
                                sx={{
                                    flex: '1 1 280px',
                                    maxWidth: 320,
                                    minWidth: 280
                                }}
                            >
                                <PlanCard
                                    plan={plan}
                                    delay={index * 0.1}
                                    onSelect={handlePlanSelect}
                                    isSelected={isPlanSelected(plan)}
                                    isActive={isPlanActive(plan.id)}
                                    endDate={getMembershipEndDate(plan.id)}
                                    disabled={!hasActiveMainPlan}
                                    disabledReason="Requires Main Plan"
                                />
                            </Box>
                        ))}
                    </Box>
                </motion.div>
            )}

                        {/* Bundle Option */}
            {upgradePlans.length > 0 && hasActiveMainPlan && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Paper
                        sx={{
                            p: 3,
                            mb: 4,
                            background: allUpgradePlansPurchased 
                                ? `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                            border: `2px solid ${allUpgradePlansPurchased ? theme.palette.grey[400] : theme.palette.success.main}`,
                            opacity: allUpgradePlansPurchased ? 0.6 : 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CelebrationIcon sx={{ 
                                fontSize: 32, 
                                color: allUpgradePlansPurchased ? 'grey.400' : 'success.main', 
                                mr: 1 
                            }} />
                            <Typography 
                                variant="h5" 
                                component="h3" 
                                fontWeight="bold" 
                                color={allUpgradePlansPurchased ? 'grey.400' : 'success.main'}
                            >
                                {allUpgradePlansPurchased ? 'All Upgrade Plans Already Purchased!' : 'Bundle All Upgrade Plans & Save!'}
                            </Typography>
                        </Box>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {allUpgradePlansPurchased 
                                ? 'You have already purchased all available upgrade plans. Enjoy your premium features!'
                                : `Get all upgrade plans together and save $${savings} per month!`
                            }
                        </Typography>

                        {!allUpgradePlansPurchased && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                        You Save
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="success.main">
                                        ${savings}/month
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <Button
                            variant={allUpgradePlansPurchased ? "outlined" : "contained"}
                            size="large"
                            fullWidth
                            disabled={allUpgradePlansPurchased}
                            onClick={handleBundlePayment}
                            sx={{
                                py: 1.5,
                                fontWeight: 'bold',
                                ...(allUpgradePlansPurchased ? {
                                    borderColor: theme.palette.grey[400],
                                    color: theme.palette.grey[400],
                                    '&:hover': {
                                        borderColor: theme.palette.grey[400],
                                        backgroundColor: 'transparent',
                                    },
                                } : {
                                    background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                                    },
                                }),
                            }}
                        >
                            {allUpgradePlansPurchased 
                                ? 'All Upgrade Plans Purchased' 
                                : `Select All Upgrade Plans ($${bundlePrice}/month)`
                            }
                        </Button>
                    </Paper>
                </motion.div>
            )}

            {/* No Main Plan Alert */}
            {!hasActiveMainPlan && mainPlans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Paper
                        sx={{
                            p: 4,
                            mb: 4,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                            border: `2px solid ${theme.palette.info.main}`,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                            Get Started with Monitoring
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Choose a main plan above to start monitoring your websites. Once you have a main plan, 
                            you'll be able to access upgrade plans and additional features.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Main plans provide the foundation for website monitoring, while upgrade plans add specialized features.
                        </Typography>
                    </Paper>
                </motion.div>
            )}

            {/* Stripe Payment Modal */}
            <StripePaymentModal
                open={showPaymentModal}
                onClose={handleClosePaymentModal}
                plan={selectedPlan}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {/* Bundle Payment Modal */}
            <BundlePaymentModal
                open={showBundlePaymentModal}
                onClose={handleCloseBundlePaymentModal}
                plans={plans}
                bundlePrice={bundlePrice}
                totalPrice={totalPrice}
                savings={savings}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </Box>
    );
} 