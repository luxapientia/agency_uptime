import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Divider,
    IconButton,
    Alert,
    Link,
    CircularProgress,
} from '@mui/material';
import {
    Email as EmailIcon,
    Telegram as TelegramIcon,
    Chat as SlackIcon,
    Forum as DiscordIcon,
    Delete as DeleteIcon,
    Notifications as PushIcon,
    Http as WebhookIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import type { NotificationSetting } from '../../types/site.types';
import { NotificationType } from '../../types/site.types';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import {
    fetchNotificationChannels,
    selectNotificationChannels,
    selectNotificationChannelsLoading,
    selectNotificationChannelsError,
} from '../../store/slices/notificationChannelSlice';
import {
    fetchNotificationSettings,
    addNotificationSetting,
    toggleNotificationSetting,
    deleteNotificationSetting,
    selectNotificationSettings,
    selectNotificationLoading,
    selectNotificationError,
} from '../../store/slices/notificationSlice';
import { showToast } from '../../utils/toast';
import axios from '../../lib/axios';

interface NotificationSettingsProps {
    siteId: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    siteId,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    // Channel info state
    const channels = useSelector(selectNotificationChannels);
    const channelsLoading = useSelector(selectNotificationChannelsLoading);
    const channelsError = useSelector(selectNotificationChannelsError);

    // Notifications state
    const notificationSettings = useSelector(selectNotificationSettings);
    const notificationLoading = useSelector(selectNotificationLoading);
    const notificationError = useSelector(selectNotificationError);

    const [notificationType, setNotificationType] = React.useState<NotificationType>(NotificationType.EMAIL);
    const [contactInfo, setContactInfo] = React.useState('');
    const [verificationCode, setVerificationCode] = React.useState('');
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [verificationLoading, setVerificationLoading] = React.useState(false);
    const [addingNotification, setAddingNotification] = React.useState(false);

    React.useEffect(() => {
        // Fetch both channel info and notifications
        dispatch(fetchNotificationChannels());
        dispatch(fetchNotificationSettings(siteId));
    }, [dispatch, siteId]);

    const handleSendVerificationCode = async () => {
        try {
            setVerificationLoading(true);
            await axios.post('/auth/send-verification', { email: contactInfo });
            setIsVerifying(true);
            showToast.success('Verification code sent to your email');
        } catch (error) {
            showToast.error('Failed to send verification code');
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyAndAdd = async () => {
        try {
            setAddingNotification(true);
            // First verify the code
            const verifyResponse = await axios.post('/auth/verify-code', {
                email: contactInfo,
                code: verificationCode
            });

            if (verifyResponse.data.verified) {
                // If verified, add the notification
                await dispatch(addNotificationSetting({ siteId, type: NotificationType.EMAIL, contactInfo })).unwrap();
                setContactInfo('');
                setVerificationCode('');
                setIsVerifying(false);
                showToast.success('Email verified and notification added successfully');
            } else {
                showToast.error('Invalid verification code');
            }
        } catch (error) {
            showToast.error('Failed to verify email: ' + error);
        } finally {
            setAddingNotification(false);
        }
    };

    const handleAdd = async (type: NotificationType, contactInfo: string) => {
        if (type === NotificationType.EMAIL && !isVerifying) {
            await handleSendVerificationCode();
            return;
        }

        if (type === NotificationType.EMAIL && isVerifying) {
            await handleVerifyAndAdd();
            return;
        }

        try {
            setAddingNotification(true);
            await dispatch(addNotificationSetting({ siteId, type, contactInfo })).unwrap();
            setContactInfo('');
            showToast.success('Notification added successfully');
        } catch (error) {
            showToast.error('Failed to add notification: ' + error);
        } finally {
            setAddingNotification(false);
        }
    };

    const handleToggle = async (notificationSetting: NotificationSetting) => {
        try {
            await dispatch(toggleNotificationSetting({
                siteId,
                notificationId: notificationSetting.id,
                enabled: !notificationSetting.enabled
            })).unwrap();
        } catch (error) {
            console.error('Failed to toggle notification:', error);
        }
    };

    const handleDelete = async (notificationSetting: NotificationSetting) => {
        try {
            await dispatch(deleteNotificationSetting({
                siteId,
                notificationId: notificationSetting.id
            })).unwrap();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.EMAIL:
                return <EmailIcon />;
            case NotificationType.TELEGRAM:
                return <TelegramIcon />;
            case NotificationType.SLACK:
                return <SlackIcon />;
            case NotificationType.DISCORD:
                return <DiscordIcon />;
            case NotificationType.PUSH_NOTIFICATION:
                return <PushIcon />;
            case NotificationType.WEB_HOOK:
                return <WebhookIcon />;
            default:
                return null;
        }
    };

    const getNotificationLabel = (type: NotificationType) => {
        return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
    };

    const renderTelegramInstructions = () => {
        if (notificationType !== NotificationType.TELEGRAM || !channels?.telegram) return null;

        return (
            <Alert
                severity="info"
                sx={{
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '2px solid rgba(59, 130, 246, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#3B82F6',
                    },
                    '& .MuiAlert-message': {
                        width: '100%',
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Telegram notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    {channels.telegram.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
                <Link 
                    href={`https://t.me/${channels.telegram.botUsername}`} 
                    target="_blank" 
                    rel="noopener"
                    sx={{
                        color: '#3B82F6',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        }
                    }}
                >
                    @{channels.telegram.botUsername}
                </Link>
            </Alert>
        );
    };

    const renderSlackInstructions = () => {
        if (notificationType !== NotificationType.SLACK || !channels?.slack) return null;

        return (
            <Alert 
                severity="info" 
                sx={{ 
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    border: '2px solid rgba(139, 92, 246, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#8B5CF6',
                    },
                    '& .MuiAlert-message': {
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Slack notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    {channels.slack.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
                {channels.slack.inviteLink && (
                    <Button
                        href={channels.slack.inviteLink}
                        target="_blank"
                        rel="noopener"
                        variant="outlined"
                        size="small"
                        sx={{ 
                            mt: 1,
                            borderRadius: '12px',
                            border: '2px solid rgba(139, 92, 246, 0.3)',
                            color: '#8B5CF6',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#8B5CF6',
                                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        Join Slack Workspace
                    </Button>
                )}
            </Alert>
        );
    };

    const renderDiscordInstructions = () => {
        if (notificationType !== NotificationType.DISCORD || !channels?.discord) return null;

        return (
            <Alert 
                severity="info" 
                sx={{ 
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '2px solid rgba(99, 102, 241, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#6366F1',
                    },
                    '& .MuiAlert-message': {
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Discord notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    {channels.discord.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
                {channels.discord.inviteLink && (
                    <Button
                        href={channels.discord.inviteLink}
                        target="_blank"
                        rel="noopener"
                        variant="outlined"
                        size="small"
                        sx={{ 
                            mt: 1,
                            borderRadius: '12px',
                            border: '2px solid rgba(99, 102, 241, 0.3)',
                            color: '#6366F1',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#6366F1',
                                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        Join Discord Server
                    </Button>
                )}
            </Alert>
        );
    };

    const renderEmailInstructions = () => {
        if (notificationType !== NotificationType.EMAIL || !channels?.email) return null;

        return (
            <Alert 
                severity="info" 
                sx={{ 
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '2px solid rgba(16, 185, 129, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#10B981',
                    },
                    '& .MuiAlert-message': {
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Email notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    {channels.email.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
            </Alert>
        );
    };

    const getHelperText = (type: NotificationType) => {
        switch (type) {
            case NotificationType.EMAIL:
                return "Enter email address";
            case NotificationType.TELEGRAM:
                return "Enter the Chat ID provided by the bot";
            case NotificationType.SLACK:
                return "Enter Slack channel or user ID";
            case NotificationType.DISCORD:
                return "Enter Discord channel ID";
            case NotificationType.PUSH_NOTIFICATION:
                return "Enter the email address associated with your GoHighLevel account";
            case NotificationType.WEB_HOOK:
                return "Enter the webhook URL to receive notifications";
            default:
                return "Enter contact information";
        }
    };

    const renderEmailVerification = () => {
        if (notificationType !== NotificationType.EMAIL || !isVerifying) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the 6-digit code sent to your email"
                    helperText="Please check your email for the verification code"
                    disabled={verificationLoading || addingNotification}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            border: '2px solid rgba(16, 185, 129, 0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                            },
                            '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10B981',
                                    borderWidth: '2px',
                                },
                                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#64748B',
                            fontWeight: 600,
                        },
                    }}
                />
                <Button
                    variant="text"
                    onClick={handleSendVerificationCode}
                    disabled={verificationLoading || addingNotification}
                    startIcon={verificationLoading && <CircularProgress size={20} />}
                    sx={{ 
                        mt: 1,
                        color: '#10B981',
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {verificationLoading ? 'Sending...' : 'Resend Code'}
                </Button>
            </Box>
        );
    };

    const renderPushInstructions = () => {
        if (notificationType !== NotificationType.PUSH_NOTIFICATION) return null;

        return (
            <Alert 
                severity="info" 
                sx={{ 
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '2px solid rgba(245, 158, 11, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#F59E0B',
                    },
                    '& .MuiAlert-message': {
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Push notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    <li>Enter the email address associated with your GoHighLevel account</li>
                    <li>Make sure you have the GoHighLevel mobile app installed</li>
                    <li>Enable push notifications in the GoHighLevel app settings</li>
                </ol>
            </Alert>
        );
    };

    const renderWebhookInstructions = () => {
        if (notificationType !== NotificationType.WEB_HOOK) return null;

        return (
            <Alert 
                severity="info" 
                sx={{ 
                    mt: 2,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    border: '2px solid rgba(6, 182, 212, 0.15)',
                    '& .MuiAlert-icon': {
                        color: '#06B6D4',
                    },
                    '& .MuiAlert-message': {
                        color: '#1E293B',
                        fontWeight: 500,
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#1E293B' }}>
                    How to set up Webhook notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem', color: '#374151' }}>
                    <li>Enter a valid HTTPS webhook URL that can receive POST requests</li>
                    <li>Your endpoint should accept JSON payloads</li>
                    <li>We will send notifications with site status updates to this URL</li>
                </ol>
            </Alert>
        );
    };

    if (channelsLoading || notificationLoading.settings) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress sx={{ color: '#3B82F6' }} />
            </Box>
        );
    }

    if (channelsError || notificationError) {
        return (
            <Alert 
                severity="error" 
                sx={{ 
                    mb: 2,
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
                {channelsError || notificationError}
            </Alert>
        );
    }

    const notificationSettingsList = Array.isArray(notificationSettings) ? notificationSettings : [];

    return (
        <Stack spacing={4}>
            {/* Current Notifications */}
            <Box>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: '#1E293B', 
                        fontWeight: 700, 
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                    }}>
                        <NotificationsIcon fontSize="small" />
                    </Box>
                    Active Notifications
                </Typography>
                <Stack spacing={2}>
                    {notificationSettingsList.map((notificationSetting) => (
                        <Box
                            key={notificationSetting.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 3,
                                background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                                border: '2px solid',
                                borderColor: notificationSetting.enabled 
                                    ? 'rgba(16, 185, 129, 0.2)' 
                                    : 'rgba(156, 163, 175, 0.2)',
                                borderRadius: '20px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                                    borderColor: notificationSetting.enabled 
                                        ? 'rgba(16, 185, 129, 0.4)' 
                                        : 'rgba(156, 163, 175, 0.4)',
                                },
                            }}
                        >
                            <Stack direction="row" spacing={2.5} alignItems="center">
                                <Box sx={{ 
                                    p: 2,
                                    borderRadius: '16px',
                                    bgcolor: notificationSetting.enabled 
                                        ? 'rgba(16, 185, 129, 0.1)' 
                                        : 'rgba(156, 163, 175, 0.1)',
                                    color: notificationSetting.enabled 
                                        ? '#10B981' 
                                        : '#9CA3AF',
                                    display: 'inline-flex',
                                }}>
                                    {getNotificationIcon(notificationSetting.type)}
                                </Box>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                                        {getNotificationLabel(notificationSetting.type)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                                        {notificationSetting.contactInfo}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Switch
                                    checked={notificationSetting.enabled}
                                    onChange={() => handleToggle(notificationSetting)}
                                    color="primary"
                                    size="medium"
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#10B981',
                                            '&:hover': {
                                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                            },
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#10B981',
                                        },
                                    }}
                                />
                                <IconButton
                                    size="medium"
                                    sx={{
                                        color: '#EF4444',
                                        p: 1.5,
                                        borderRadius: '12px',
                                        '&:hover': {
                                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                                            transform: 'scale(1.05)',
                                        },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onClick={() => handleDelete(notificationSetting)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>
                    ))}
                    {notificationSettingsList.length === 0 && (
                        <Box sx={{ 
                            py: 4, 
                            textAlign: 'center',
                            background: 'linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 100%)',
                            borderRadius: '20px',
                            border: '2px dashed rgba(156, 163, 175, 0.3)',
                        }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: '#64748B',
                                    fontWeight: 500,
                                }}
                            >
                                No notifications configured
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>

            <Divider sx={{ 
                borderColor: 'rgba(156, 163, 175, 0.2)', 
                borderWidth: '2px',
                borderRadius: '1px',
            }} />

            {/* Add New Notification */}
            <Box>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: '#1E293B', 
                        fontWeight: 700, 
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                    }}>
                        <AddIcon fontSize="small" />
                    </Box>
                    Add New Notification
                </Typography>
                <Stack spacing={3}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#64748B', fontWeight: 600 }}>Notification Type</InputLabel>
                        <Select
                            value={notificationType}
                            onChange={(e) => {
                                setNotificationType(e.target.value as NotificationType);
                                setIsVerifying(false);
                                setVerificationCode('');
                            }}
                            label="Notification Type"
                            disabled={verificationLoading || addingNotification}
                            sx={{
                                borderRadius: '16px',
                                border: '2px solid rgba(59, 130, 246, 0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3B82F6',
                                        borderWidth: '2px',
                                    },
                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                                },
                            }}
                        >
                            {Object.values(NotificationType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box sx={{ 
                                            p: 1,
                                            borderRadius: '8px',
                                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3B82F6',
                                        }}>
                                            {getNotificationIcon(type)}
                                        </Box>
                                        <Typography sx={{ fontWeight: 500, color: '#1E293B' }}>
                                            {getNotificationLabel(type)}
                                        </Typography>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Contact Info"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        helperText={getHelperText(notificationType)}
                        disabled={verificationLoading || addingNotification}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                border: '2px solid rgba(59, 130, 246, 0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                                },
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3B82F6',
                                        borderWidth: '2px',
                                    },
                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#64748B',
                                fontWeight: 600,
                            },
                            '& .MuiFormHelperText-root': {
                                color: '#64748B',
                                fontWeight: 500,
                            },
                        }}
                    />
                    {renderEmailVerification()}
                    {renderTelegramInstructions()}
                    {renderSlackInstructions()}
                    {renderDiscordInstructions()}
                    {renderEmailInstructions()}
                    {renderPushInstructions()}
                    {renderWebhookInstructions()}
                    <Button
                        variant="contained"
                        onClick={() => handleAdd(notificationType, contactInfo)}
                        disabled={
                            !contactInfo.trim() || 
                            verificationLoading || 
                            addingNotification || 
                            (notificationType === NotificationType.EMAIL && isVerifying && !verificationCode.trim())
                        }
                        startIcon={(verificationLoading || addingNotification) && <CircularProgress size={20} color="inherit" />}
                        sx={{
                            borderRadius: '16px',
                            py: 1.5,
                            px: 4,
                            fontWeight: 600,
                            fontSize: '1rem',
                            background: `linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)`,
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                            '&:hover': {
                                background: `linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)`,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                            },
                            '&:disabled': {
                                background: 'rgba(156, 163, 175, 0.3)',
                                boxShadow: 'none',
                                transform: 'none',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {notificationType === NotificationType.EMAIL
                            ? (isVerifying 
                                ? (addingNotification ? 'Verifying & Adding...' : 'Verify & Add Email')
                                : (verificationLoading ? 'Sending Code...' : 'Send Verification Code'))
                            : (addingNotification ? 'Adding...' : 'Add Notification')}
                    </Button>
                </Stack>
            </Box>
        </Stack>
    );
};

export default NotificationSettings; 