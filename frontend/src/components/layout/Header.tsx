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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  ExitToApp,
  Business,
  DashboardOutlined,
  KeyboardArrowDown,
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
                  display: 'block',
                  backgroundImage: `url(${rootUrl}/${logo})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'left center',
                  height: '50px',
                  width: '200px', // Give more space for the logo to breathe
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'perspective(1000px) rotateY(0deg)',
                  transformOrigin: 'left center',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(10deg) scale(1.05)',
                  },
                }}
              />
              
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationDropdown />
                
                <Tooltip title="Account settings" TransitionComponent={Zoom}>
                  <IconButton
                    onClick={handleMenu}
                    size="large"
                    sx={{
                      color: 'inherit',
                      '&:hover': {
                        backgroundColor: alpha('#fff', 0.1),
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: theme.palette.primary.dark,
                        color: theme.palette.primary.contrastText,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <KeyboardArrowDown sx={{ ml: 0.5, fontSize: 20 }} />
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  onClick={handleClose}
                  PaperProps={{
                    sx: {
                      minWidth: 200,
                      mt: 1,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => navigate('/settings')}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <ExitToApp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
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