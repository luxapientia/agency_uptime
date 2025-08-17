import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import adminService from '../../services/admin.service';
import type { AdminUser, UpdateUserRequest } from '../../types/admin.types';
import UserSitesModal from './UserSitesModal';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';

interface UserManagementProps {}

export default function UserManagement({}: UserManagementProps) {
  const theme = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sitesModalOpen, setSitesModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(value.toLowerCase()) ||
          user.lastName.toLowerCase().includes(value.toLowerCase()) ||
          user.email.toLowerCase().includes(value.toLowerCase()) ||
          user.companyName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setPage(0);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    if(event) {

    }
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleUserCreated = () => {
    fetchUsers(); // Refresh the user list
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewSites = (user: AdminUser) => {
    setSelectedUserId(user.id);
    setSitesModalOpen(true);
  };

  const handleSaveUser = async (userId: string, data: UpdateUserRequest) => {
    try {
      setError(null);
      await adminService.updateUser(userId, data);
      
      // Refresh users list to show updated data
      await fetchUsers();
      
      // Close modal
      setEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      throw new Error('Failed to update user. Please try again.');
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user accounts, permissions, and feature access
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 400 }}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{ minWidth: 120 }}
          >
            Add User
          </Button>
        </Stack>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sites</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.companyName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'SUPER_ADMIN' ? 'error' : user.role === 'ADMIN' ? 'warning' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user._count.sites}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          sites
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={`View ${user._count.sites} monitored site${user._count.sites !== 1 ? 's' : ''}`}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewSites(user)}
                            sx={{ 
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                              },
                            }}
                          >
                            <LanguageIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                          sx={{ color: theme.palette.primary.main }}
                          title="Edit User"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user)}
                          sx={{ color: theme.palette.error.main }}
                          title="Delete User"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Edit User Modal */}
      <EditUserModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />

      {/* Add User Modal */}
      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Sites Modal */}
      <UserSitesModal
        open={sitesModalOpen}
        onClose={() => setSitesModalOpen(false)}
        userId={selectedUserId}
      />
    </Box>
  );
} 