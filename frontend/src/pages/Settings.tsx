import { Box, Typography } from '@mui/material';
import ThemeSettings from '../components/settings/ThemeSettings';

export default function Settings() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <ThemeSettings />
    </Box>
  );
} 