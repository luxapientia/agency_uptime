import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    useTheme,
    Card,
    CardContent,
    Stack,
    Chip,
    IconButton,
    Tooltip as MuiTooltip,
    ButtonGroup,
} from '@mui/material';
import {
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    ZoomOutMap as ResetZoomIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceArea,
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

// Predefined color palette for workers
const WORKER_COLOR_PALETTE = [
    '#1976d2', // blue
    '#2e7d32', // green
    '#ed6c02', // orange
    '#9c27b0', // purple
    '#d32f2f', // red
    '#795548', // brown
    '#607d8b', // blue grey
    '#388e3c', // light green
    '#f57c00', // amber
    '#c2185b', // pink
    '#7b1fa2', // deep purple
    '#303f9f', // indigo
    '#0288d1', // light blue
    '#00796b', // teal
    '#689f38', // light green
    '#fbc02d', // yellow
    '#f57f17', // lime
    '#e64a19', // deep orange
    '#5d4037', // brown
    '#455a64', // blue grey
];

// Special colors for known worker types
const SPECIAL_WORKER_COLORS = {
    'consensus_worker': '#2e7d32', // Always green for consensus
};

// Cache for assigned colors to ensure consistency
const workerColorCache = new Map<string, string>();

const getWorkerColor = (workerId: string, allWorkerIds: string[] = []) => {
    // Check for special worker types first
    if (SPECIAL_WORKER_COLORS[workerId as keyof typeof SPECIAL_WORKER_COLORS]) {
        return SPECIAL_WORKER_COLORS[workerId as keyof typeof SPECIAL_WORKER_COLORS];
    }

    // Check cache first
    if (workerColorCache.has(workerId)) {
        return workerColorCache.get(workerId)!;
    }

    // Filter out special workers from the list to get proper index
    const regularWorkers = allWorkerIds.filter(id =>
        !SPECIAL_WORKER_COLORS[id as keyof typeof SPECIAL_WORKER_COLORS]
    );

    // Find index of this worker in the regular workers list
    const workerIndex = regularWorkers.indexOf(workerId);

    // Assign color based on index (cycle through palette if needed)
    const colorIndex = workerIndex >= 0 ? workerIndex % WORKER_COLOR_PALETTE.length : 0;
    const assignedColor = WORKER_COLOR_PALETTE[colorIndex];

    // Cache the color for consistency
    workerColorCache.set(workerId, assignedColor);

    return assignedColor;
};

// Helper function to get display name for worker
const getWorkerDisplayName = (workerId: string) => {
    if (workerId === 'consensus_worker') {
        return 'Consensus';
    }

    // If it's a UUID-like string, shorten it
    if (workerId.length > 12 && workerId.includes('-')) {
        return `Worker ${workerId.slice(0, 8)}`;
    }

    // For short worker IDs, capitalize first letter
    return workerId.charAt(0).toUpperCase() + workerId.slice(1);
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

    // Zoom state management
    const [zoomDomain, setZoomDomain] = useState<{ left?: number, right?: number } | undefined>(undefined);
    const [refAreaLeft, setRefAreaLeft] = useState<string>('');
    const [refAreaRight, setRefAreaRight] = useState<string>('');
    const [isZooming, setIsZooming] = useState(false);

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
    const activeWorkers = workerIds
        .filter(workerId =>
            chartData.some(item => (item as any)[workerId] !== null && (item as any)[workerId] !== undefined)
        )
        .sort((a, b) => {
            // Always put consensus_worker first
            if (a === 'consensus_worker') return -1;
            if (b === 'consensus_worker') return 1;
            // Then sort alphabetically
            return a.localeCompare(b);
        });

    // Zoom control functions
    const handleZoomIn = useCallback(() => {
        if (!zoomDomain) {
            const dataLength = chartData.length;
            const middle = Math.floor(dataLength / 2);
            const range = Math.floor(dataLength * 0.3);
            setZoomDomain({
                left: Math.max(0, middle - range),
                right: Math.min(dataLength - 1, middle + range)
            });
        } else {
            const range = zoomDomain.right! - zoomDomain.left!;
            const newRange = Math.max(2, Math.floor(range * 0.7));
            const middle = zoomDomain.left! + Math.floor(range / 2);
            setZoomDomain({
                left: Math.max(0, middle - Math.floor(newRange / 2)),
                right: Math.min(chartData.length - 1, middle + Math.floor(newRange / 2))
            });
        }
    }, [zoomDomain, chartData.length]);

    const handleZoomOut = useCallback(() => {
        if (zoomDomain) {
            const range = zoomDomain.right! - zoomDomain.left!;
            const newRange = Math.min(chartData.length, Math.floor(range * 1.5));
            const middle = zoomDomain.left! + Math.floor(range / 2);
            const newLeft = Math.max(0, middle - Math.floor(newRange / 2));
            const newRight = Math.min(chartData.length - 1, middle + Math.floor(newRange / 2));

            if (newLeft === 0 && newRight === chartData.length - 1) {
                setZoomDomain(undefined);
            } else {
                setZoomDomain({ left: newLeft, right: newRight });
            }
        }
    }, [zoomDomain, chartData.length]);

    const handleResetZoom = useCallback(() => {
        setZoomDomain(undefined);
        setRefAreaLeft('');
        setRefAreaRight('');
        setIsZooming(false);
    }, []);

    const handleMouseDown = useCallback((e: any) => {
        if (e?.activeLabel) {
            setRefAreaLeft(e.activeLabel);
            setIsZooming(true);
        }
    }, []);

    const handleMouseMove = useCallback((e: any) => {
        if (isZooming && e?.activeLabel && refAreaLeft) {
            setRefAreaRight(e.activeLabel);
        }
    }, [isZooming, refAreaLeft]);

    const handleMouseUp = useCallback(() => {
        if (refAreaLeft && refAreaRight && refAreaLeft !== refAreaRight) {
            const leftIndex = chartData.findIndex(item => item.timestamp === refAreaLeft);
            const rightIndex = chartData.findIndex(item => item.timestamp === refAreaRight);

            if (leftIndex !== -1 && rightIndex !== -1) {
                setZoomDomain({
                    left: Math.min(leftIndex, rightIndex),
                    right: Math.max(leftIndex, rightIndex)
                });
            }
        }

        setRefAreaLeft('');
        setRefAreaRight('');
        setIsZooming(false);
    }, [refAreaLeft, refAreaRight, chartData]);

    // Get the data to display based on zoom
    const displayData = (zoomDomain && zoomDomain.left !== undefined && zoomDomain.right !== undefined)
        ? chartData.slice(zoomDomain.left, zoomDomain.right + 1)
        : chartData;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        const validPayload = payload.filter((entry: any) =>
            entry.value !== null &&
            entry.value !== undefined &&
            entry.stroke &&
            entry.stroke !== 'none' &&
            !entry.stroke.startsWith('url(')
        );
        if (validPayload.length === 0) return null;

        return (
            <Box
                sx={{
                    background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.95)
                        : alpha(theme.palette.background.paper, 0.98),
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2,
                    p: 2,
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 32px rgba(0,0,0,0.4)'
                        : '0 8px 32px rgba(0,0,0,0.12)',
                    maxWidth: 280,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        borderRadius: '2px 2px 0 0',
                    }
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        mb: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: '0.875rem'
                    }}
                >
                    {label}
                </Typography>
                {validPayload.map((entry: any, index: number) => (
                    <Stack
                        key={index}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mb: index === validPayload.length - 1 ? 0 : 1 }}
                    >
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: entry.stroke,
                                boxShadow: `0 0 8px ${alpha(entry.stroke, 0.4)}`,
                                border: `2px solid ${alpha(entry.stroke, 0.3)}`,
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                            }}
                        >
                            {entry.name}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: entry.stroke,
                            }}
                        >
                            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{unit}
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

                    {/* Zoom Status Indicator */}
                    {zoomDomain && (
                        <Chip
                            label={`Zoomed: ${Math.round(((zoomDomain.right! - zoomDomain.left! + 1) / chartData.length) * 100)}% of data`}
                            size="small"
                            sx={{
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                fontSize: '0.7rem',
                                height: 24,
                                ml: 1,
                            }}
                        />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Zoom Controls */}
                    {chartData.length > 0 && (
                        <ButtonGroup
                            size="small"
                            variant="outlined"
                            sx={{
                                mr: 2,
                                '& .MuiButton-root': {
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    }
                                }
                            }}
                        >
                            <MuiTooltip title="Zoom In">
                                <IconButton
                                    onClick={handleZoomIn}
                                    size="small"
                                    sx={{
                                        borderRadius: '4px 0 0 4px',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }}
                                >
                                    <ZoomInIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </MuiTooltip>

                            <MuiTooltip title="Zoom Out">
                                <IconButton
                                    onClick={handleZoomOut}
                                    disabled={!zoomDomain}
                                    size="small"
                                    sx={{
                                        borderRadius: 0,
                                        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        borderLeft: 'none',
                                        borderRight: 'none',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }}
                                >
                                    <ZoomOutIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </MuiTooltip>

                            <MuiTooltip title="Reset Zoom">
                                <IconButton
                                    onClick={handleResetZoom}
                                    disabled={!zoomDomain}
                                    size="small"
                                    sx={{
                                        borderRadius: '0 4px 4px 0',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }}
                                >
                                    <ResetZoomIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </MuiTooltip>
                        </ButtonGroup>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {activeWorkers.map(workerId => (
                            <Chip
                                key={workerId}
                                label={getWorkerDisplayName(workerId)}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(getWorkerColor(workerId, activeWorkers), 0.1),
                                    color: getWorkerColor(workerId, activeWorkers),
                                    borderColor: getWorkerColor(workerId, activeWorkers),
                                    fontSize: '0.75rem',
                                    fontWeight: workerId === 'consensus_worker' ? 600 : 400,
                                }}
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                </Stack>

                {chartData.length > 0 && activeWorkers.length > 0 ? (
                    <Box
                        sx={{
                            width: '100%',
                            height: { xs: height - 50, sm: height },
                            background: theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.02)} 0%, ${alpha(theme.palette.secondary.dark, 0.02)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.03)} 100%)`,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: theme.palette.mode === 'dark'
                                    ? `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%)`
                                    : `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 50%)`,
                                pointerEvents: 'none',
                            },
                            '& .recharts-text': {
                                fontSize: { xs: '10px !important', sm: '12px !important' },
                                fontWeight: '500 !important',
                            },
                            '& .recharts-cartesian-grid-horizontal line:last-child, & .recharts-cartesian-grid-vertical line:last-child': {
                                display: 'none',
                            },
                            '& .recharts-cartesian-grid line': {
                                stroke: alpha(theme.palette.divider, 0.3),
                                strokeDasharray: '2 4',
                            },
                            '& .recharts-cartesian-axis-tick-value': {
                                fill: theme.palette.text.secondary,
                            },
                            '& .recharts-legend-wrapper': {
                                paddingBottom: '10px !important',
                            },
                            '& .recharts-default-legend': {
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '16px',
                                flexWrap: 'wrap',
                            },
                        }}
                    >
                        <ResponsiveContainer>
                            <ComposedChart
                                data={displayData}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                margin={{
                                    top: 25,
                                    right: 35,
                                    left: 25,
                                    bottom: 40,
                                }}
                            >
                                <defs>
                                    {activeWorkers.map((workerId) => (
                                        <linearGradient
                                            key={`gradient-${workerId}`}
                                            id={`gradient-${workerId}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor={getWorkerColor(workerId, activeWorkers)}
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor={getWorkerColor(workerId, activeWorkers)}
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    ))}
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="2 4"
                                    stroke={alpha(theme.palette.divider, 0.3)}
                                    vertical={false}
                                    horizontal={true}
                                />

                                <XAxis
                                    dataKey="timestamp"
                                    angle={0}
                                    textAnchor="middle"
                                    height={45}
                                    tick={{
                                        fill: theme.palette.text.secondary,
                                        fontSize: 11,
                                        fontWeight: 500,
                                    }}
                                    stroke={alpha(theme.palette.divider, 0.5)}
                                    strokeWidth={1}
                                    tickMargin={12}
                                    interval="preserveStartEnd"
                                    axisLine={true}
                                />

                                <YAxis
                                    tick={{
                                        fill: theme.palette.text.secondary,
                                        fontSize: 11,
                                        fontWeight: 500,
                                    }}
                                    stroke={alpha(theme.palette.divider, 0.5)}
                                    strokeWidth={1}
                                    tickMargin={8}
                                    axisLine={true}
                                    label={{
                                        value: `Response Time (${unit})`,
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: {
                                            fill: theme.palette.text.secondary,
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            textAnchor: 'middle',
                                        }
                                    }}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    wrapperStyle={{ outline: 'none' }}
                                    animationDuration={200}
                                    cursor={{
                                        stroke: alpha(theme.palette.primary.main, 0.4),
                                        strokeWidth: 2,
                                        strokeDasharray: '4 4',
                                    }}
                                />

                                <Legend
                                    verticalAlign="top"
                                    height={40}
                                    wrapperStyle={{
                                        paddingBottom: '24px',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                    }}
                                    iconType="circle"
                                />

                                {/* Reference area for zoom selection */}
                                {refAreaLeft && refAreaRight && (
                                    <ReferenceArea
                                        x1={refAreaLeft}
                                        x2={refAreaRight}
                                        strokeOpacity={0.3}
                                        fill={alpha(theme.palette.primary.main, 0.1)}
                                        stroke={theme.palette.primary.main}
                                    />
                                )}

                                {/* Area fills with gradients */}
                                {activeWorkers.map((workerId) => (
                                    <Area
                                        key={`area-${workerId}`}
                                        type="monotone"
                                        dataKey={workerId}
                                        fill={`url(#gradient-${workerId})`}
                                        stroke="none"
                                        connectNulls={false}
                                        animationDuration={1200}
                                        animationEasing="ease-out"
                                    />
                                ))}

                                {/* Line charts on top */}
                                {activeWorkers.map((workerId) => {
                                    const isConsensus = workerId === 'consensus_worker';
                                    return (
                                        <Line
                                            key={workerId}
                                            type="monotone"
                                            dataKey={workerId}
                                            stroke={getWorkerColor(workerId, activeWorkers)}
                                            strokeWidth={isConsensus ? 3 : 2.5}
                                            strokeDasharray={isConsensus ? '0' : '0'}
                                            dot={{
                                                fill: getWorkerColor(workerId, activeWorkers),
                                                strokeWidth: 0,
                                                r: 0,
                                            }}
                                            activeDot={{
                                                r: isConsensus ? 6 : 5,
                                                strokeWidth: 2,
                                                stroke: alpha(getWorkerColor(workerId, activeWorkers), 0.8),
                                                fill: getWorkerColor(workerId, activeWorkers),
                                                filter: `drop-shadow(0 0 6px ${alpha(getWorkerColor(workerId, activeWorkers), 0.6)})`,
                                            }}
                                            name={getWorkerDisplayName(workerId)}
                                            connectNulls={false}
                                            animationDuration={1200}
                                            animationEasing="ease-out"
                                        />
                                    );
                                })}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: { xs: 4, sm: 6 },
                            px: 3,
                            background: theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.08)} 0%, ${alpha(theme.palette.secondary.dark, 0.08)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                            borderRadius: 3,
                            border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                            minHeight: height / 2,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: theme.palette.mode === 'dark'
                                    ? `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`
                                    : `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 70%)`,
                                pointerEvents: 'none',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: theme.palette.mode === 'dark'
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
                                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%': { opacity: 0.6, transform: 'scale(1)' },
                                    '50%': { opacity: 1, transform: 'scale(1.05)' },
                                    '100%': { opacity: 0.6, transform: 'scale(1)' },
                                },
                            }}
                        >
                            {icon}
                        </Box>

                        <Typography
                            variant="h6"
                            sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                                mb: 1,
                                fontSize: '1.1rem',
                            }}
                        >
                            No Data Available
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                maxWidth: 400,
                                opacity: 0.8,
                            }}
                        >
                            {tcpPort
                                ? `TCP port ${tcpPort} response time data will appear here once monitoring begins.`
                                : `${title.toLowerCase()} data will appear here once monitoring begins.`}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
} 