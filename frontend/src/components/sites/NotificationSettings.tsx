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
    useTheme,
} from '@mui/material';
import {
    Email as EmailIcon,
    Telegram as TelegramIcon,
    Chat as SlackIcon,
    Forum as DiscordIcon,
    Delete as DeleteIcon,
    Notifications as PushIcon,
    Http as WebhookIcon,
} from '@mui/icons-material';
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
    addNotification,
    toggleNotificationSetting,
    deleteNotificationSetting,
    selectNotificationSettings,
    selectNotificationLoading,
    selectNotificationError,
} from '../../store/slices/notificationSlice';
import { showToast } from '../../utils/toast';
import axios from '../../lib/axios';
import { alpha } from '@mui/material/styles';

interface NotificationSettingsProps {
    siteId: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    siteId,
}) => {
    const theme = useTheme();
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
                await dispatch(addNotification({ siteId, type: NotificationType.EMAIL, contactInfo })).unwrap();
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
            await dispatch(addNotification({ siteId, type, contactInfo })).unwrap();
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
                    '& .MuiAlert-message': {
                        width: '100%'
                    }
                }}
            >
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Telegram notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                    {channels.telegram.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
                <Link href={`https://t.me/${channels.telegram.botUsername}`} target="_blank" rel="noopener">@{channels.telegram.botUsername}</Link>
            </Alert>
        );
    };

    const renderSlackInstructions = () => {
        if (notificationType !== NotificationType.SLACK || !channels?.slack) return null;

        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Slack notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
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
                        sx={{ mt: 1 }}
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
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Discord notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
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
                        sx={{ mt: 1 }}
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
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Email notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
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
                />
                <Button
                    variant="text"
                    onClick={handleSendVerificationCode}
                    disabled={verificationLoading || addingNotification}
                    startIcon={verificationLoading && <CircularProgress size={20} />}
                    sx={{ mt: 1 }}
                >
                    {verificationLoading ? 'Sending...' : 'Resend Code'}
                </Button>
            </Box>
        );
    };

    const renderPushInstructions = () => {
        if (notificationType !== NotificationType.PUSH_NOTIFICATION) return null;

        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Push notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
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
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    How to set up Webhook notifications:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: '1rem' }}>
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
                <CircularProgress />
            </Box>
        );
    }

    if (channelsError || notificationError) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {channelsError || notificationError}
            </Alert>
        );
    }

    const notificationSettingsList = Array.isArray(notificationSettings) ? notificationSettings : [];

    return (
        <Stack spacing={3}>
            {/* Current Notifications */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Active Notifications
                </Typography>
                <Stack spacing={1}>
                    {notificationSettingsList.map((notificationSetting) => (
                        <Box
                            key={notificationSetting.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                borderRadius: theme.shape.borderRadius,
                                bgcolor: theme.palette.background.paper,
                                transition: theme.transitions.create(['border-color', 'box-shadow']),
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                                },
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ color: theme.palette.primary.main }}>
                                    {getNotificationIcon(notificationSetting.type)}
                                </Box>
                                <Box>
                                    <Typography variant="body2">
                                        {getNotificationLabel(notificationSetting.type)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {notificationSetting.contactInfo}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Switch
                                    checked={notificationSetting.enabled}
                                    onChange={() => handleToggle(notificationSetting)}
                                    color="primary"
                                    size="small"
                                />
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: theme.palette.error.main,
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.error.main, 0.08),
                                        },
                                    }}
                                    onClick={() => handleDelete(notificationSetting)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>
                    ))}
                    {notificationSettingsList.length === 0 && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                py: 2, 
                                textAlign: 'center',
                                bgcolor: theme.palette.grey[50],
                                borderRadius: theme.shape.borderRadius,
                            }}
                        >
                            No notifications configured
                        </Typography>
                    )}
                </Stack>
            </Box>

            <Divider sx={{ borderColor: theme.palette.divider }} />

            {/* Add New Notification */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Add New Notification
                </Typography>
                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Notification Type</InputLabel>
                        <Select
                            value={notificationType}
                            onChange={(e) => {
                                setNotificationType(e.target.value as NotificationType);
                                setIsVerifying(false);
                                setVerificationCode('');
                            }}
                            label="Notification Type"
                            disabled={verificationLoading || addingNotification}
                        >
                            {Object.values(NotificationType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ color: theme.palette.primary.main }}>
                                            {getNotificationIcon(type)}
                                        </Box>
                                        <Typography>{getNotificationLabel(type)}</Typography>
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
                            borderRadius: '16px', // Using a fixed value that matches Material-UI's common border radius multiplier
                            py: 1,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                            '&:hover': {
                                background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
                            },
                            '&:disabled': {
                                background: theme.palette.action.disabledBackground,
                            }
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