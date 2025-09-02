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
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Star as StarIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Rocket as RocketIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import type { AppDispatch, RootState } from '../store';
import { fetchMembershipPlans, fetchUserMemberships } from '../store/slices/membershipSlice';
import type { MembershipPlan } from '../types/membership.types';
import StripePaymentModal from '../components/payment/StripePaymentModal';
import { getFeatureDescription, isValidFeatureKey } from '../utils/featureUtils';

interface PlanCardProps {
    plan: MembershipPlan;
    isPopular?: boolean;
    delay: number;
    onSelect: (plan: MembershipPlan) => void;
    isSelected?: boolean;
    isActive?: boolean;
    disabled?: boolean;
    disabledReason?: string;
    isUpgrade?: boolean;
}

const PlanCard = ({ plan, isPopular = false, delay, onSelect, isSelected, isActive = false, disabled = false, disabledReason, isUpgrade = false }: PlanCardProps) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const [isHovered, setIsHovered] = useState(false);

    const getPlanIcon = (planName: string) => {
        switch (planName.toLowerCase()) {
            case 'intro plan':
                return <RocketIcon />;
            case 'starter plan':
                return <StarIcon />;
            case 'professional plan':
                return <TrendingUpIcon />;
            case 'enterprise plan':
                return <BusinessIcon />;
            default:
                return <RocketIcon />;
        }
    };

    const getPlanColor = (planName: string) => {
        switch (planName.toLowerCase()) {
            case 'intro plan':
                return '#06B6D4'; // Cyan
            case 'starter plan':
                return '#10B981'; // Green
            case 'professional plan':
                return '#3B82F6'; // Blue
            case 'enterprise plan':
                return '#8B5CF6'; // Purple
            default:
                return '#06B6D4'; // Cyan
        }
    };

    const planColor = getPlanColor(plan.name);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{ height: '100%' }}
        >
            <Card
                sx={{
                    height: '100%',
                    minHeight: 600,
                    position: 'relative',
                    background: isPopular
                        ? `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)`
                        : `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)`,
                    border: isSelected
                        ? `2px solid ${planColor}`
                        : isPopular
                            ? `2px solid rgba(59, 130, 246, 0.3)`
                            : `2px solid rgba(156, 163, 175, 0.2)`,
                    borderRadius: '24px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
                    boxShadow: isHovered
                        ? `0 20px 40px rgba(0, 0, 0, 0.15)`
                        : `0 8px 25px rgba(0, 0, 0, 0.08)`,
                    cursor: 'pointer',
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {isPopular && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1,
                        }}
                    >
                        <Chip
                            icon={<StarIcon />}
                            label="Most Popular"
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                py: 1,
                                px: 2,
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                color: 'white',
                                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                                '& .MuiChip-icon': {
                                    color: 'white',
                                },
                            }}
                        />
                    </Box>
                )}

                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Stack spacing={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Plan Header */}
                        <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 64,
                                    height: 64,
                                    borderRadius: '20px',
                                    background: `linear-gradient(135deg, ${planColor} 0%, ${planColor}dd 100%)`,
                                    color: 'white',
                                    mb: 3,
                                    boxShadow: `0 8px 20px ${planColor}40`,
                                }}
                            >
                                {getPlanIcon(plan.name)}
                            </Box>

                            <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 700, color: '#1E293B' }}>
                                {plan.title}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(156, 163, 175, 0.2)', borderWidth: '2px', flexShrink: 0 }} />

                        {/* Price */}
                        <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                            <Typography variant="h2" component="div" sx={{ fontWeight: 800, color: planColor, mb: 1 }}>
                                ${plan.price}
                            </Typography>
                            <Typography variant="body1" color="#64748B" sx={{ fontWeight: 600 }}>
                                one-time
                            </Typography>
                        </Box>

                        {/* Monitored Sites */}
                        {plan.monitoredSites && (
                            <Box sx={{ textAlign: 'center', mb: 2, flexShrink: 0 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                                    {plan.monitoredSites} Website{plan.monitoredSites > 1 ? 's' : ''}
                                </Typography>
                                <Typography variant="body2" color="#64748B" sx={{ fontWeight: 500 }}>
                                    Monitored
                                </Typography>
                            </Box>
                        )}

                        {/* Features */}
                        {plan.features && plan.features.length > 0 && (
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1E293B', textAlign: 'center', flexShrink: 0 }}>
                                    What's Included
                                </Typography>
                                <Stack spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
                                    {plan.features.map((feature, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    backgroundColor: planColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2,
                                                    flexShrink: 0,
                                                    boxShadow: `0 2px 8px ${planColor}40`,
                                                    mt: 0.5,
                                                }}
                                            >
                                                <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                                            </Box>
                                            <Typography variant="body1" color="#374151" sx={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.4 }}>
                                                {isValidFeatureKey(feature) ? getFeatureDescription(feature) : feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Action Button */}
                        <Box sx={{ mt: 'auto', pt: 2, flexShrink: 0 }}>
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
                                    fontWeight: 700,
                                    py: 2,
                                    px: 3,
                                    borderRadius: '16px',
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    ...(isActive ? {
                                        borderColor: '#10B981',
                                        color: '#10B981',
                                        borderWidth: '2px',
                                        '&:hover': {
                                            borderColor: '#059669',
                                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                        },
                                    } : disabled ? {
                                        borderColor: '#9CA3AF',
                                        color: '#9CA3AF',
                                        backgroundColor: '#F3F4F6',
                                        '&:hover': {
                                            borderColor: '#9CA3AF',
                                            backgroundColor: '#F3F4F6',
                                        },
                                    } : {
                                        background: `linear-gradient(135deg, ${planColor} 0%, ${planColor}dd 100%)`,
                                        boxShadow: `0 8px 20px ${planColor}40`,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, ${planColor}dd 0%, ${planColor} 100%)`,
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 12px 30px ${planColor}60`,
                                        },
                                    }),
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                {isActive ? 'Current Plan' : disabled ? disabledReason || 'Unavailable' : isUpgrade ? 'Upgrade Plan' : 'Subscribe Now'}
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
    const { plans, userMemberships, isLoading, error } = useSelector((state: RootState) => state.membership);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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

    // Helper function to check if user has an active membership for a plan
    const isPlanActive = (planId: string) => {
        const now = new Date();
        return userMemberships.some(membership =>
            membership.membershipPlanId === planId &&
            new Date(membership.endDate) > now
        );
    };

    const isPlanSelected = (plan: MembershipPlan) => {
        return selectedPlan?.id === plan.id;
    };

    // Helper function to get plan tier level (for upgrade/downgrade logic)
    const getPlanTier = (planName: string): number => {
        switch (planName.toLowerCase()) {
            case 'intro plan':
                return 1;
            case 'starter plan':
                return 2;
            case 'professional plan':
                return 3;
            case 'enterprise plan':
                return 4;
            default:
                return 1;
        }
    };

    // Helper function to check if a plan is a downgrade
    const isDowngrade = (plan: MembershipPlan): boolean => {
        if (!hasActiveMainPlan || !activeMainPlan) return false;
        
        const currentTier = getPlanTier(activeMainPlan.name);
        const newTier = getPlanTier(plan.name);
        
        return newTier < currentTier;
    };

    // Helper function to check if a plan is an upgrade
    const isUpgrade = (plan: MembershipPlan): boolean => {
        if (!hasActiveMainPlan || !activeMainPlan) return false;
        
        const currentTier = getPlanTier(activeMainPlan.name);
        const newTier = getPlanTier(plan.name);
        
        return newTier > currentTier;
    };

    // Only show main plans
    const mainPlans = plans.filter(plan => plan.type === 'main');

    // Check if user has any active main plan
    const hasActiveMainPlan = mainPlans.some(plan => isPlanActive(plan.id));

    // Get the active main plan (user can only have one)
    const activeMainPlan = mainPlans.find(plan => isPlanActive(plan.id));

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#3B82F6' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert
                    severity="error"
                    sx={{
                        borderRadius: '16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '2px solid rgba(239, 68, 68, 0.15)',
                        '& .MuiAlert-icon': {
                            color: '#EF4444',
                        },
                        '& .MuiAlert-message': {
                            color: '#1E293B',
                            fontWeight: 500,
                        }
                    }}
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 800,
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                        }}
                    >
                        Choose Your Plan
                    </Typography>
                    <Typography variant="h5" color="#64748B" sx={{ mb: 4, fontWeight: 500, maxWidth: 600, mx: 'auto' }}>
                        Select the perfect plan for your monitoring needs. Start monitoring your websites with our powerful uptime tracking platform.
                    </Typography>
                </Box>
            </motion.div>

            {/* Main Plans */}
            {mainPlans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                            {hasActiveMainPlan ? 'Your Current Plan' : 'Available Plans'}
                        </Typography>
                        <Typography variant="h6" color="#64748B" sx={{ mb: 3, fontWeight: 500, maxWidth: 700, mx: 'auto' }}>
                            {hasActiveMainPlan
                                ? `You are currently subscribed to the ${activeMainPlan?.title} plan. You can upgrade or change to any other plan.`
                                : 'Choose a plan to start monitoring your websites with our powerful uptime tracking platform'
                            }
                        </Typography>
                        {hasActiveMainPlan && activeMainPlan && (
                            <Alert
                                severity="success"
                                sx={{
                                    mt: 4,
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    border: '2px solid rgba(16, 185, 129, 0.15)',
                                    maxWidth: 600,
                                    mx: 'auto',
                                    '& .MuiAlert-icon': {
                                        color: '#10B981',
                                    },
                                    '& .MuiAlert-message': {
                                        color: '#1E293B',
                                        fontWeight: 500,
                                    }
                                }}
                            >
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    <strong>Active Plan:</strong> {activeMainPlan.title} - ${activeMainPlan.price} one-time
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { 
                                xs: '1fr', 
                                sm: 'repeat(auto-fit, minmax(320px, 1fr))',
                                md: 'repeat(auto-fit, minmax(350px, 1fr))',
                                lg: 'repeat(4, 1fr)'
                            },
                            gap: { xs: 3, md: 4 },
                            alignItems: 'stretch',
                            mb: 6,
                            maxWidth: 1400,
                            mx: 'auto'
                        }}
                    >
                        {mainPlans.map((plan, index) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                isPopular={plan.name === 'Professional Plan'}
                                delay={index * 0.1}
                                onSelect={handlePlanSelect}
                                isSelected={isPlanSelected(plan)}
                                isActive={isPlanActive(plan.id)}
                                disabled={isDowngrade(plan)}
                                disabledReason={isDowngrade(plan) ? "Cannot downgrade" : undefined}
                                isUpgrade={isUpgrade(plan)}
                            />
                        ))}
                    </Box>
                </motion.div>
            )}

            {/* No Plans Available */}
            {mainPlans.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Box sx={{
                        textAlign: 'center',
                        background: 'linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 100%)',
                        borderRadius: '24px',
                        border: '2px dashed rgba(156, 163, 175, 0.3)',
                        p: 6,
                        mb: 4
                    }}>
                        <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 700, color: '#64748B' }}>
                            No Plans Available
                        </Typography>
                        <Typography variant="body1" color="#64748B" sx={{ fontWeight: 500 }}>
                            Please contact support to set up membership plans.
                        </Typography>
                    </Box>
                </motion.div>
            )}

            {/* Stripe Payment Modal */}
            <StripePaymentModal
                open={showPaymentModal}
                onClose={handleClosePaymentModal}
                plan={selectedPlan}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </Box>
    );
} 