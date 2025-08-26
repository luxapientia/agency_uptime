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
    Security as SecurityIcon,
    CheckCircle as CheckCircleIcon,
    Diamond as DiamondIcon,
    Rocket as RocketIcon,
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
    endDate?: Date | null;
    disabled?: boolean;
    disabledReason?: string;
}

const PlanCard = ({ plan, isPopular = false, delay, onSelect, isSelected, isActive = false, endDate, disabled = false, disabledReason }: PlanCardProps) => {
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
            case 'agency':
                return <DiamondIcon />;
            default:
                return <RocketIcon />;
        }
    };

    const getPlanColor = (planName: string) => {
        switch (planName.toLowerCase()) {
            case 'starter':
                return '#10B981'; // Green
            case 'professional':
                return '#3B82F6'; // Blue
            case 'enterprise':
                return '#8B5CF6'; // Purple
            case 'agency':
                return '#F59E0B'; // Amber
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
        >
            <Card
                sx={{
                    height: '100%',
                    minHeight: 520,
                    position: 'relative',
                    background: isPopular
                        ? `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)`
                        : `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)`,
                    border: isSelected
                        ? `2px solid ${planColor}`
                        : isPopular
                            ? `2px solid rgba(245, 158, 11, 0.3)`
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
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                color: 'white',
                                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
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
                        <Box sx={{ textAlign: 'center' }}>
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

                            <Typography variant="body1" color="#64748B" sx={{ mb: 2, lineHeight: 1.6 }}>
                                {plan.description}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(156, 163, 175, 0.2)', borderWidth: '2px' }} />

                        {/* Price */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" component="div" sx={{ fontWeight: 800, color: planColor, mb: 1 }}>
                                ${plan.price}
                            </Typography>
                            <Typography variant="body1" color="#64748B" sx={{ fontWeight: 600 }}>
                                per month
                            </Typography>
                        </Box>

                        {/* Features */}
                        {plan.features && plan.features.length > 0 && (
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1E293B', textAlign: 'center' }}>
                                    What's Included
                                </Typography>
                                <Stack spacing={2}>
                                    {plan.features.map((feature, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
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
                                                }}
                                            >
                                                <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                                            </Box>
                                            <Typography variant="body1" color="#374151" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                                {isValidFeatureKey(feature) ? getFeatureDescription(feature) : feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Membership Status */}
                        <Box sx={{ textAlign: 'center', mb: 2, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isActive && endDate ? (
                                <Chip
                                    label={`Active until ${formatDate(endDate)}`}
                                    sx={{
                                        fontWeight: 700,
                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                        color: 'white',
                                        border: '2px solid rgba(16, 185, 129, 0.3)',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                    }}
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

            {/* Current Memberships */}
            {userMemberships.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Box sx={{
                        background: 'linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 100%)',
                        borderRadius: '24px',
                        border: '2px solid rgba(59, 130, 246, 0.1)',
                        p: 4,
                        mb: 6,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 700, color: '#1E293B' }}>
                            Your Current Membership
                        </Typography>
                        <Typography variant="body1" color="#64748B" sx={{ mb: 4, fontWeight: 500 }}>
                            Plans you're currently subscribed to
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                            {userMemberships
                                .filter(membership => new Date(membership.endDate) > new Date())
                                .map((membership) => (
                                    <Chip
                                        key={membership.id}
                                        label={`${membership.membershipPlan.title} - Expires ${formatDate(new Date(membership.endDate))}`}
                                        sx={{
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            color: 'white',
                                            border: '2px solid rgba(16, 185, 129, 0.3)',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                            fontSize: '0.95rem',
                                            py: 1,
                                        }}
                                    />
                                ))}
                        </Box>
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
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                            {hasActiveMainPlan ? 'Your Current Plan' : 'Available Plans'}
                        </Typography>
                        <Typography variant="h6" color="#64748B" sx={{ mb: 3, fontWeight: 500, maxWidth: 700, mx: 'auto' }}>
                            {hasActiveMainPlan
                                ? `You are currently subscribed to the ${activeMainPlan?.title} plan`
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
                                    <strong>Active Plan:</strong> {activeMainPlan.title} - ${activeMainPlan.price}/month
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(350px, 1fr))' },
                            gap: 4,
                            justifyContent: 'center',
                            mb: 6
                        }}
                    >
                        {mainPlans.map((plan, index) => (
                            <Box
                                key={plan.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
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
                                    disabledReason={hasActiveMainPlan && !isPlanActive(plan.id) ? "One Plan Only" : undefined}
                                />
                            </Box>
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