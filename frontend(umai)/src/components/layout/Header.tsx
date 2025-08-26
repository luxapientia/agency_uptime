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
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp,
  Business,
  DashboardOutlined,
  KeyboardArrowDown,
  Payment,
  AdminPanelSettings,
  MonitorHeart,
  Speed,
  Shield,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Header() {
  const rootUrl = import.meta.env.VITE_ROOT_URL;
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const logo = useSelector((state: RootState) => state.settings.settings.logo);

  // Determine which logo to use based on domain
  const getLogoPath = () => {
    if (window.location.hostname.includes('uptimemonitoring')) {
      return 'logo2.png';
    }
    return logo || 'logo.png';
  };

  const logoPath = getLogoPath();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard' },
    { text: 'Sites', icon: <Business />, path: '/sites' },
    { text: 'Membership Plans', icon: <Payment />, path: '/membership-plans' },
    // Only show Admin menu item for admin users
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? [
      { text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' }
    ] : []),
  ];

  const publicMenuItems = [
    { text: 'FAQ', path: '/faq' },
    { text: 'Privacy Policy', path: '/privacy-policy' },
    { text: 'Terms of Service', path: '/terms' },
  ];

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.15)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <MonitorHeart sx={{ fontSize: 28, color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 700,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
              : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
            textAlign: 'center',
          }}
        >
          Uptime Monitoring
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Professional Website Monitoring
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
              borderRadius: 2,
              mb: 1,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                transform: 'translateX(6px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
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
                transition: 'color 0.3s ease-in-out',
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
                  transition: 'color 0.3s ease-in-out',
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
        elevation={0}
        sx={{
          background: isScrolled 
            ? theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.95)'
              : 'rgba(255, 255, 255, 0.95)'
            : theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isScrolled ? alpha(theme.palette.divider, 0.2) : 'transparent'}`,
          transition: 'all 0.3s ease-in-out',
          '& .MuiToolbar-root': {
            color: theme.palette.text.primary,
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 70, sm: 80, md: 80 } }}>
          {isAuthenticated && isMobile && (
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease-in-out',
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
              gap: 2,
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
                  outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                  outlineOffset: 2,
                  borderRadius: 2,
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'block',
                  backgroundImage: `url(${rootUrl}/${logoPath})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'left center',
                  height: '50px',
                  width: '200px',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'perspective(1000px) rotateY(0deg)',
                  transformOrigin: 'left center',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(5deg) scale(1.02)',
                    filter: 'brightness(1.1)',
                  },
                }}
              />
            </Box>

            {/* Feature highlights for public users */}
            {!isAuthenticated && !isMobile && (
              <Box sx={{ display: 'flex', gap: 1.5, ml: 4 }}>
                <Chip
                  icon={<Speed />}
                  label="Real-time Monitoring"
                  size="small"
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '& .MuiChip-icon': { color: theme.palette.primary.main },
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
                <Chip
                  icon={<Shield />}
                  label="SSL & Security"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    color: theme.palette.secondary.main,
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: theme.palette.secondary.main },
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      background: alpha(theme.palette.secondary.main, 0.05),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
              </Box>
            )}
          </Box>

          {isAuthenticated ? (
            <>
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 1.5, mr: 3 }}>
                  {menuItems.map((item) => (
                    <Button
                      key={item.text}
                      startIcon={item.icon}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        position: 'relative',
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        background: location.pathname === item.path 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                        color: location.pathname === item.path 
                          ? theme.palette.primary.main 
                          : theme.palette.text.primary,
                        border: location.pathname === item.path 
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                          : '1px solid transparent',
                        '&:hover': {
                          backgroundColor: location.pathname === item.path 
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NotificationDropdown />
                
                <Tooltip title="Account settings" TransitionComponent={Zoom}>
                  <IconButton
                    onClick={handleMenu}
                    size="large"
                    sx={{
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: theme.palette.primary.contrastText,
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    >
                      {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <KeyboardArrowDown sx={{ ml: 0.5, fontSize: 20, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  onClick={handleClose}
                  PaperProps={{
                    sx: {
                      minWidth: 220,
                      mt: 2,
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <ExitToApp fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <>
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
                  {publicMenuItems.map((item) => (
                    <Button
                      key={item.text}
                      onClick={() => navigate(item.path)}
                      sx={{
                        color: theme.palette.text.secondary,
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        position: 'relative',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          color: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </Box>
              )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    color: theme.palette.primary.main,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 600,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
            </>
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
              backgroundColor: theme.palette.background.paper,
              backdropFilter: 'blur(20px)',
            },
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
} 