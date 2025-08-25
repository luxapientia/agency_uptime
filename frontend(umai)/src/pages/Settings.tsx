import { Box, Typography, Stack } from '@mui/material';
import ThemeSettings from '../components/settings/ThemeSettings';
import DomainSettings from '../components/settings/DomainSettings';

export default function Settings() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Stack spacing={4}>
        <DomainSettings />
        <ThemeSettings />
      </Stack>
    </Box>
  );
} 