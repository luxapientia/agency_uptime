import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Search,
  Business,
} from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import Footer from '../components/layout/Footer';
import type { PublicSite } from '../types/site.types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const PublicSites: React.FC = () => {
  const theme = useTheme();
  const [allSites, setAllSites] = useState<PublicSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<PublicSite[]>([]);
  const [displayedSites, setDisplayedSites] = useState<PublicSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all sites from the public API
      const response = await fetch('/api/all-sites');
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      const data = await response.json();
      setAllSites(data.sites || []);
      setFilteredSites(data.sites || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Filter sites based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSites(allSites);
    } else {
      const filtered = allSites.filter(site => 
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.user.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSites(filtered);
    }
    // Reset to page 1 when filtering
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, allSites]);

  // Update pagination when filtered sites change
  useEffect(() => {
    const total = filteredSites.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const currentPage = Math.min(pagination.page, totalPages || 1);
    
    setPagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: currentPage,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    }));
  }, [filteredSites, pagination.limit]);

  // Update displayed sites based on current page and limit
  useEffect(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setDisplayedSites(filteredSites.slice(startIndex, endIndex));
  }, [filteredSites, pagination.page, pagination.limit]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if(event) {

    }
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleLimitChange = (event: any) => {
    const newLimit = event.target.value;
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getLastChecked = (siteId: string) => {
    const site = allSites.find(s => s.id === siteId);
    const status = (site as any)?.statuses?.[0];
    if (!status || !status.checkedAt) return 'Never';
    
    const date = new Date(status.checkedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusChip = (siteId: string) => {
    const site = allSites.find(s => s.id === siteId);
    const status = (site as any)?.statuses?.[0];
    const isUp = status?.isUp || false;
    
    if (isUp) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Online"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    } else {
      return (
        <Chip
          icon={<Cancel />}
          label="Offline"
          color="error"
          size="small"
          variant="outlined"
        />
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </Box>
        <Footer variant="public" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
          <Container maxWidth="lg">
            <Alert severity="error" sx={{ fontSize: '1.1rem' }}>
              {error}
            </Alert>
          </Container>
        </Box>
        <Footer variant="public" />
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ py: { xs: 6, md: 8 }, background: 'white' }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 2,
              }}
            >
              Site Status Monitor
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              Real-time status of all monitored websites. Check the health and performance of your favorite sites.
            </Typography>
          </Box>

          {/* Search Filter */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <TextField
              placeholder="Search sites by name, URL, or agency..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              size="medium"
              sx={{
                width: { xs: '100%', sm: '400px', md: '500px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Search Results Indicator */}
          {searchTerm && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Search results for "{searchTerm}" • {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          )}

          {/* Sites Table */}
          {displayedSites.length > 0 ? (
            <>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: theme.palette.grey[50] }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Site Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Agency</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>URL</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Last Checked</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedSites.map((site) => {
                        return (
                          <TableRow 
                            key={site.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: theme.palette.action.hover,
                              },
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {site.user.themeSettings?.logo ? (
                                  <Avatar 
                                    src={site.user.themeSettings.logo} 
                                    alt={site.user.companyName} 
                                    sx={{ width: 24, height: 24 }} 
                                  />
                                ) : (
                                  <Avatar 
                                    sx={{ 
                                      width: 24, 
                                      height: 24,
                                      bgcolor: theme.palette.primary.main,
                                      color: theme.palette.primary.contrastText,
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    <Business sx={{ fontSize: '0.875rem' }} />
                                  </Avatar>
                                )}
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {site.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: theme.palette.text.secondary,
                                  fontStyle: 'italic'
                                }}
                              >
                                {site.user.companyName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  wordBreak: 'break-all',
                                }}
                              >
                                {site.url}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getStatusChip(site.id)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                {getLastChecked(site.id)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Pagination Controls */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mt: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2
              }}>
                {/* Items per page selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Items per page:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={pagination.limit}
                      onChange={handleLimitChange}
                      displayEmpty
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Pagination info */}
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sites
                </Typography>

                {/* Pagination component */}
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {searchTerm ? 'No sites found matching your search.' : 'No sites are currently being monitored.'}
              </Typography>
              {searchTerm && (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Try adjusting your search terms or browse all sites.
                </Typography>
              )}
            </Box>
          )}

          {/* Summary Stats */}
          {allSites.length > 0 && (
            <Box sx={{ mt: 6, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Box sx={{ textAlign: 'center', p: 3, background: theme.palette.grey[50], borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {allSites.length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Total Sites
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 3, background: theme.palette.grey[50], borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  {allSites.filter(site => (site as any)?.statuses?.[0]?.isUp).length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Online Sites (Total)
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 3, background: theme.palette.grey[50], borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                  {allSites.filter(site => !(site as any)?.statuses?.[0]?.isUp).length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Offline Sites (Total)
                </Typography>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
      <Footer variant="public" />
    </Layout>
  );
};

export default PublicSites; 