import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Menu,
  IconButton,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  NotificationsOutlined,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  WarningOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { selectUnseenNotifications, markNotificationsAsSeen } from '../../store/slices/notificationSlice';
import type { Notification } from '../../types/notification.types';
import type { AppDispatch } from '../../store';

const NOTIFICATIONS_PER_PAGE = 10;

export default function NotificationDropdown() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const unseenNotifications = useSelector(selectUnseenNotifications);
  
  // Local state for notifications
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Initialize local notifications when dropdown opens
  useEffect(() => {
    if (anchorEl && localNotifications.length === 0) {
      setLocalNotifications(unseenNotifications.slice(0, NOTIFICATIONS_PER_PAGE));
      setPage(1);
      setHasMore(unseenNotifications.length > NOTIFICATIONS_PER_PAGE);
    }
  }, [anchorEl, unseenNotifications]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: document.querySelector('#notification-menu-list'),
      rootMargin: '20px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        loadMoreNotifications();
      }
    }, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading]);

  // Observe loading element
  useEffect(() => {
    if (loadingRef.current && observerRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
    return () => {
      if (loadingRef.current && observerRef.current) {
        observerRef.current.unobserve(loadingRef.current);
      }
    };
  }, [loadingRef.current]);

  // Track viewed notifications
  const handleNotificationInView = useCallback((notification: Notification) => {
    if (!viewedIds.has(notification.id)) {
      setViewedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notification.id);
        return newSet;
      });
    }
  }, [viewedIds]);

  // Load more notifications
  const loadMoreNotifications = () => {
    setIsLoading(true);
    const start = page * NOTIFICATIONS_PER_PAGE;
    const end = start + NOTIFICATIONS_PER_PAGE;
    const newNotifications = unseenNotifications.slice(start, end);
    
    setTimeout(() => {
      setLocalNotifications(prev => [...prev, ...newNotifications]);
      setPage(prev => prev + 1);
      setHasMore(end < unseenNotifications.length);
      setIsLoading(false);
    }, 500); // Simulate loading delay
  };

  // Mark notifications as seen when closing dropdown
  const handleClose = () => {
    if (viewedIds.size > 0) {
      dispatch(markNotificationsAsSeen(Array.from(viewedIds)));
    }
    setAnchorEl(null);
    setLocalNotifications([]);
    setViewedIds(new Set());
    setPage(1);
    setHasMore(true);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

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
        id="notification-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            overflow: 'hidden', // Hide default scrollbar
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
        
        <List
          id="notification-menu-list"
          sx={{
            p: 0,
            maxHeight: 320,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.text.disabled,
            },
          }}
        >
          {localNotifications.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No new notifications
              </Typography>
            </Box>
          ) : (
            <>
              {localNotifications.map((notification: Notification) => (
                <ListItem
                  key={notification.id}
                  ref={(element) => {
                    if (element) {
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting) {
                            handleNotificationInView(notification);
                            observer.disconnect();
                          }
                        },
                        { threshold: 0.5 }
                      );
                      observer.observe(element);
                    }
                  }}
                  sx={{
                    backgroundColor: viewedIds.has(notification.id) 
                      ? 'transparent' 
                      : alpha(theme.palette.primary.main, 0.04),
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
                      sx: { 
                        fontWeight: viewedIds.has(notification.id) ? 'normal' : 500 
                      }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'textSecondary',
                    }}
                  />
                </ListItem>
              ))}
              {hasMore && (
                <Box
                  ref={loadingRef}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 2,
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
            </>
          )}
        </List>

        <Divider />
        
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            onClick={handleViewAll}
            endIcon={<ArrowForward />}
            sx={{
              justifyContent: 'space-between',
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
} 