import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { SiteStatus } from '../../types/site.types';

interface WorkerResponseTimeChartProps {
  title: string;
  siteStatuses: SiteStatus[];
  responseTimeField: 'pingResponseTime' | 'httpResponseTime' | 'dnsResponseTime';
  unit?: string;
  height?: number;
  icon?: React.ReactNode;
  tcpPort?: number; // For TCP response times
}

const WORKER_COLORS = {
  'consensus_worker': '#2e7d32', // green
  'us-east': '#1976d2',          // blue
  'us-west': '#ed6c02',          // orange
  'eu': '#9c27b0',               // purple
  'asia': '#d32f2f',             // red
  'worker1': '#795548',          // brown
  'worker2': '#607d8b',          // blue grey
  'default': '#757575',          // grey
};

const getWorkerColor = (workerId: string) => {
  return WORKER_COLORS[workerId as keyof typeof WORKER_COLORS] || WORKER_COLORS.default;
};

export default function WorkerResponseTimeChart({ 
  title, 
  siteStatuses, 
  responseTimeField,
  unit = 'ms', 
  height = 300,
  icon,
  tcpPort
}: WorkerResponseTimeChartProps) {
  const theme = useTheme();

  // Transform SiteStatus array into chart data
  const transformData = () => {
    if (!siteStatuses.length) return [];

    // Group statuses by timestamp
    const timeGroups: { [key: string]: { [workerId: string]: number | null } } = {};
    
    siteStatuses.forEach(status => {
      const timestamp = new Date(status.checkedAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      if (!timeGroups[timestamp]) {
        timeGroups[timestamp] = {};
      }

      let responseTime: number | null = null;

             if (tcpPort && status.tcpChecks) {
         // Handle TCP response times
         const tcpChecksArray = Array.isArray(status.tcpChecks) 
           ? status.tcpChecks 
           : Object.values(status.tcpChecks);
         
         const tcpCheck = tcpChecksArray.find((check: any) => check?.port === tcpPort) as any;
         responseTime = tcpCheck?.responseTime || null;
      } else {
        // Handle other response times
        responseTime = status[responseTimeField] || null;
      }

      timeGroups[timestamp][status.workerId] = responseTime;
    });

    // Convert to array format for recharts
    return Object.entries(timeGroups).map(([timestamp, workers]) => ({
      timestamp,
      ...workers
    }));
  };

  const chartData = transformData();
  
     // Get unique worker IDs that have data
   const workerIds = Array.from(new Set(siteStatuses.map(status => status.workerId)));
   const activeWorkers = workerIds.filter(workerId => 
     chartData.some(item => (item as any)[workerId] !== null && (item as any)[workerId] !== undefined)
   );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <Box
        sx={{
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1.5,
          boxShadow: theme.shadows[3],
          maxWidth: 250,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {payload
          .filter((entry: any) => entry.value !== null && entry.value !== undefined)
          .map((entry: any, index: number) => (
            <Stack
              key={index}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{unit}
              </Typography>
            </Stack>
          ))}
      </Box>
    );
  };

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.6)
          : theme.palette.background.paper,
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          {icon}
          <Typography 
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {activeWorkers.map(workerId => (
              <Chip
                key={workerId}
                label={workerId}
                size="small"
                sx={{
                  backgroundColor: alpha(getWorkerColor(workerId), 0.1),
                  color: getWorkerColor(workerId),
                  borderColor: getWorkerColor(workerId),
                  fontSize: '0.75rem',
                }}
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>

        {chartData.length > 0 ? (
          <Box 
            sx={{ 
              width: '100%',
              height: { xs: height - 50, sm: height },
              '& .recharts-text': {
                fontSize: { xs: '10px !important', sm: '12px !important' }
              },
              '& .recharts-cartesian-grid-horizontal line:last-child, & .recharts-cartesian-grid-vertical line:last-child': {
                display: 'none',
              },
            }}
          >
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 35,
                }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={alpha(theme.palette.text.primary, 0.05)}
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  angle={0}
                  textAnchor="middle"
                  height={40}
                  tick={{ 
                    fill: theme.palette.text.secondary,
                    fontSize: 10,
                  }}
                  stroke={theme.palette.divider}
                  tickMargin={10}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ 
                    fill: theme.palette.text.secondary,
                    fontSize: 10,
                  }}
                  stroke={theme.palette.divider}
                  label={{ 
                    value: `Response Time (${unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      fill: theme.palette.text.secondary,
                      fontSize: '12px',
                    }
                  }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingBottom: '20px',
                    fontSize: '0.75rem',
                  }}
                />
                {activeWorkers.map((workerId) => (
                  <Line
                    key={workerId}
                    type="monotone"
                    dataKey={workerId}
                    stroke={getWorkerColor(workerId)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 4, 
                      strokeWidth: 0,
                      fill: getWorkerColor(workerId),
                    }}
                    name={workerId}
                    connectNulls={false}
                    animationDuration={1000}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 3, sm: 4 },
              px: 2,
              background: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              minHeight: height / 2,
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
              gutterBottom
            >
              No Data Available
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              align="center"
              sx={{ fontSize: '0.8rem' }}
            >
              Response time data will appear here once monitoring begins.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 