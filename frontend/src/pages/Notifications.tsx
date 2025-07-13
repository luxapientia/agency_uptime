import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Stack,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  WarningOutlined,
  NotificationsNoneOutlined as NotificationIcon,
} from '@mui/icons-material';
import { selectAllNotifications, fetchAllNotifications } from '../store/slices/notificationSlice';
import type { AppDispatch } from '../store';
import type { Notification } from '../types/notification.types';

export default function Notifications() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(selectAllNotifications);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAllNotifications());
  }, [dispatch]);

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

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return targetDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!notifications) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 'bold',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
            : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Notifications
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: theme.shape.borderRadius,
          overflow: 'auto',
          maxWidth: '100%',
          '& .MuiTableCell-root': {
            borderColor: theme.palette.divider,
          }
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.05)
            }}>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Message</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Created</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">Viewed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Stack spacing={2} alignItems="center">
                    <NotificationIcon sx={{ fontSize: 48, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" color="textSecondary">
                      No notifications yet
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? notifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : notifications
              ).map((notification: Notification) => (
                <TableRow
                  key={notification.id}
                  sx={{
                    bgcolor: notification.seen ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <TableCell align="center">
                    <Tooltip title={notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}>
                      <IconButton size="small" sx={{ p: 0 }}>
                        {getNotificationIcon(notification.type)}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      color="textPrimary"
                      sx={{
                        fontWeight: notification.seen ? 'normal' : 500
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        fontWeight: notification.seen ? 'normal' : 500
                      }}
                    >
                      {formatDate(notification.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontStyle: notification.seen ? 'normal' : 'italic'
                      }}
                    >
                      {notification.seen ? formatDate(notification.updatedAt) : 'Not viewed yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {notifications.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={notifications.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              '.MuiTablePagination-select': {
                color: theme.palette.text.primary
              },
              '.MuiTablePagination-displayedRows': {
                color: theme.palette.text.secondary
              }
            }}
          />
        )}
      </TableContainer>
    </Box>
  );
} 