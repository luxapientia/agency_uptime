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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import adminService from '../../services/admin.service';

interface AIPrompt {
  id: string;
  name: string;
  title: string;
  description: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromptManagement() {
  const theme = useTheme();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    systemPrompt: '',
    userPromptTemplate: '',
    isActive: true,
  });

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPrompts();
      
      // Handle the response structure - check if data exists and is an array
      if (response && response.data && Array.isArray(response.data)) {
        setPrompts(response.data);
      } else {
        console.error('Invalid response format:', response);
        setPrompts([]);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenDialog = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      title: prompt.title,
      description: prompt.description || '',
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      isActive: prompt.isActive,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPrompt(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      systemPrompt: '',
      userPromptTemplate: '',
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!editingPrompt) return;
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        userPromptTemplate: formData.userPromptTemplate,
        isActive: formData.isActive,
      };
      
      await adminService.updatePrompt(editingPrompt.id, updateData);
      await fetchPrompts();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          AI Prompt Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Edit AI prompts for site health analysis and status prediction
        </Typography>
      </Box>

      {/* Prompts Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts.map((prompt) => (
              <motion.tr
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {prompt.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {prompt.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                    {prompt.description || 'No description'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={prompt.isActive ? 'Active' : 'Inactive'}
                    color={prompt.isActive ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(prompt.updatedAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="Edit Prompt">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(prompt)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit AI Prompt
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                size="small"
                placeholder="e.g., site_health_analysis"
                disabled
                helperText="Name cannot be changed"
              />
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                size="small"
                placeholder="e.g., Site Health Analysis"
              />
            </Box>
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Brief description of what this prompt does"
            />
            
            <TextField
              label="System Prompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="The system prompt that defines the AI's role and behavior"
            />
            
            <TextField
              label="User Prompt Template"
              value={formData.userPromptTemplate}
              onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
              fullWidth
              multiline
              rows={8}
              size="small"
              placeholder="The user prompt template with placeholders like {{siteName}}, {{analysisData}}, etc."
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Update Prompt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 