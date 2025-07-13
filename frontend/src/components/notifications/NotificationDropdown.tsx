import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  NotificationsOutlined,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  WarningOutlined,
} from '@mui/icons-material';
import { selectAllNotifications, selectUnseenNotifications, markNotificationsAsSeen } from '../../store/slices/notificationSlice';
import type { Notification } from '../../types/notification.types';
import type { AppDispatch } from '../../store';

export default function NotificationDropdown() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const notifications = useSelector(selectAllNotifications);
  const unseenNotifications = useSelector(selectUnseenNotifications);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Mark notifications as seen when opening the dropdown
  useEffect(() => {
    if (anchorEl && unseenNotifications.length > 0) {
      const unseenIds = unseenNotifications.map(n => n.id);
      dispatch(markNotificationsAsSeen(unseenIds));
    }
  }, [anchorEl, unseenNotifications, dispatch]);

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircleOutline sx={{ color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorOutline sx={{ color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningOutlined sx={{ color: theme.palette.warning.main }} />;
      default:
        return <InfoOutlined sx={{ color: theme.palette.info.main }} />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: alpha('#fff', 0.1),
          },
        }}
      >
        <Badge badgeContent={unseenNotifications.length} color="error">
          <NotificationsOutlined />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            overflow: 'auto',
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" color="textPrimary">
            Notifications
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You have {unseenNotifications.length} unread notifications
          </Typography>
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification: Notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  backgroundColor: notification.seen ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.message}
                  secondary={formatDate(notification.createdAt)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'textPrimary',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'textSecondary',
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
} 