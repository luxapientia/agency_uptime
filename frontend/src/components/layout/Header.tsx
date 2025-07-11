import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  alpha,
  Tooltip,
  Zoom,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  Person,
  ExitToApp,
  Business,
  DashboardOutlined,
  NotificationsOutlined,
  KeyboardArrowDown,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

export default function Header() {
  const rootUrl = import.meta.env.VITE_ROOT_URL;
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const logo = useSelector((state: RootState) => state.settings.settings.logo);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleClose();
    await dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard' },
    { text: 'Sites', icon: <Business />, path: '/sites' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`
          : `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
      }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
              : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Agency Uptime
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              handleDrawerToggle();
            }}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: theme.shape.borderRadius,
              mb: 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                transform: 'translateX(4px)',
              },
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                color: location.pathname === item.path 
                  ? theme.palette.primary.main 
                  : theme.palette.text.primary,
                fontWeight: location.pathname === item.path ? 600 : 500,
                sx: {
                  transition: 'color 0.2s ease-in-out',
                }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={isScrolled ? 2 : 0}
        sx={{
          background: isScrolled 
            ? theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.95)})`
              : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.95)}, ${alpha(theme.palette.primary.light, 0.95)})`
            : theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.85)}, ${alpha(theme.palette.primary.main, 0.85)})`
              : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.85)}, ${alpha(theme.palette.primary.light, 0.85)})`,
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${isScrolled ? 'transparent' : alpha(theme.palette.primary.main, 0.1)}`,
          transition: theme.transitions.create(
            ['background', 'box-shadow', 'border-bottom'],
            { duration: theme.transitions.duration.short }
          ),
          '& .MuiToolbar-root': {
            color: theme.palette.primary.contrastText,
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70, md: 70 } }}>
          {isAuthenticated && isMobile && (
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                color: 'inherit',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1),
                },
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              onClick={() => navigate('/')}
              onKeyPress={(e) => e.key === 'Enter' && navigate('/')}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                outline: 'none',
                '&:focus-visible': {
                  outline: `2px solid ${alpha('#fff', 0.5)}`,
                  outlineOffset: 2,
                  borderRadius: 1,
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundImage: `url(${rootUrl}/${logo})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  width: 'auto',
                  height: { xs: '48px', sm: '56px', md: '64px' },
                  aspectRatio: '1',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'perspective(1000px) rotateY(0deg)',
                  transformOrigin: 'center center',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(10deg) scale(1.05)',
                  },
                }}
              />
              {!isSmall && (
                <Box
                  sx={{
                    ml: { sm: 1, md: 2 },
                    opacity: 0.9,
                    transition: 'all 0.3s ease-in-out',
                    transform: 'translateX(0)',
                    '&:hover': {
                      opacity: 1,
                      transform: 'translateX(5px)',
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { sm: '1.1rem', md: '1.25rem' },
                      fontWeight: 600,
                      color: 'inherit',
                      textShadow: `0 2px 4px ${alpha('#000', 0.15)}`,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Agency Uptime
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {isAuthenticated ? (
            <>
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  {menuItems.map((item) => (
                    <Button
                      key={item.text}
                      startIcon={item.icon}
                      endIcon={location.pathname === item.path && <KeyboardArrowDown />}
                      onClick={() => navigate(item.path)}
                      sx={{
                        color: 'inherit',
                        borderRadius: theme.shape.borderRadius,
                        px: 2,
                        py: 1,
                        position: 'relative',
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        '&:hover': {
                          backgroundColor: alpha('#fff', 0.1),
                        },
                        '&::after': location.pathname === item.path ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '30%',
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: '#fff',
                        } : {},
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {!isSmall && (
                  <Tooltip title="Notifications" TransitionComponent={Zoom} arrow>
                    <IconButton
                      size="small"
                      onClick={handleNotificationClick}
                      sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Badge badgeContent={3} color="error">
                        <NotificationsOutlined />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Account settings" TransitionComponent={Zoom} arrow>
                  <IconButton
                    size="small"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    sx={{
                      p: 0.5,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        border: `2px solid ${theme.palette.primary.main}`,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        bgcolor: theme.palette.primary.main,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        fontWeight: 600,
                      }}
                    >
                      {user?.firstName?.[0]}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>

              <Menu
                id="notification-menu"
                anchorEl={notificationAnchor}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    width: 320,
                    maxHeight: 400,
                    overflow: 'auto',
                    borderRadius: theme.shape.borderRadius,
                    mt: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    backdropFilter: 'blur(8px)',
                  },
                }}
              >
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Notifications
                  </Typography>
                </Box>
                {/* Add notification items here */}
              </Menu>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    width: 220,
                    borderRadius: theme.shape.borderRadius,
                    mt: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    backdropFilter: 'blur(8px)',
                    '& .MuiMenuItem-root': {
                      borderRadius: theme.shape.borderRadius,
                      mx: 0.5,
                      my: 0.25,
                      px: 2,
                      py: 1,
                      gap: 1.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(4px)',
                      },
                    },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Welcome back,
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5, mx: 0.5 }} />
                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <Person fontSize="small" color="primary" />
                  </ListItemIcon>
                  <Typography color={theme.palette.text.primary}>Profile</Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <Settings fontSize="small" color="primary" />
                  </ListItemIcon>
                  <Typography color={theme.palette.text.primary}>Settings</Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5, mx: 0.5 }} />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography color={theme.palette.error.main}>Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: 'inherit',
                  borderRadius: theme.shape.borderRadius,
                  px: { xs: 2, sm: 3 },
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.1),
                  },
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  px: { xs: 2, sm: 3 },
                  backgroundColor: 'white',
                  color: theme.palette.primary.main,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.9),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {isAuthenticated && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.8)
                : theme.palette.background.paper,
              backdropFilter: 'blur(8px)',
            },
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
} 