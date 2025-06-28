
import { Box, Typography } from '@mui/material';

export default function Dashboard() {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to your Agency Uptime dashboard. Start monitoring your websites.
      </Typography>
    </Box>
  );
} 