import { Router } from 'express';
import { kimiPredictiveService } from '../services/kimiPredictive.service';

const router = Router();

// Helper function to build incidents from status data
function buildIncidents(statuses: any[], days: number = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentStatuses = statuses.filter(s => new Date(s.checkedAt) >= cutoffDate);
  
  const incidents: Array<{
    start: Date;
    end: Date | null;
    durationMin: number;
    layer: 'HTTP' | 'PING' | 'DNS' | 'UNKNOWN';
    cause: string;
    resolution: string;
  }> = [];

  let currentIncident: any = null;

  for (const status of recentStatuses.reverse()) {
    const isDown = !status.isUp;
    
    if (isDown && !currentIncident) {
      // Start new incident
      currentIncident = {
        start: new Date(status.checkedAt),
        end: null,
        layer: determineLayer(status),
        cause: generatePlainEnglishCause(status),
        resolution: ''
      };
    } else if (!isDown && currentIncident) {
      // End current incident
      currentIncident.end = new Date(status.checkedAt);
      currentIncident.durationMin = Math.round(
        (currentIncident.end.getTime() - currentIncident.start.getTime()) / (1000 * 60)
      );
      currentIncident.resolution = generatePlainEnglishResolution(status);
      incidents.push(currentIncident);
      currentIncident = null;
    }
  }

  // Handle ongoing incident
  if (currentIncident) {
    currentIncident.durationMin = Math.round(
      (Date.now() - currentIncident.start.getTime()) / (1000 * 60)
    );
    incidents.push(currentIncident);
  }

  return incidents;
}

// Helper function to determine which layer is affected
function determineLayer(status: any): 'HTTP' | 'PING' | 'DNS' | 'UNKNOWN' {
  if (!status.httpIsUp) return 'HTTP';
  if (!status.pingIsUp) return 'PING';
  if (!status.dnsIsUp) return 'DNS';
  return 'UNKNOWN';
}

// Helper function to generate plain English cause descriptions
function generatePlainEnglishCause(status: any): string {
  if (!status.httpIsUp) {
    if (status.httpResponseTime === null) {
      return 'Website server is not responding';
    }
    return 'Website is experiencing technical difficulties';
  }
  if (!status.pingIsUp) {
    return 'Network connectivity issues detected';
  }
  if (!status.dnsIsUp) {
    return 'Domain name resolution problems';
  }
  return 'Service availability issue detected';
}

// Helper function to generate plain English resolution descriptions
function generatePlainEnglishResolution(status: any): string {
  if (status.isUp) {
    return 'Service has been restored and is now operational';
  }
  return 'Issue is being investigated and resolved';
}

// Helper function to calculate uptime percentage
function calculateUptime(statuses: any[], days: number = 30): number {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentStatuses = statuses.filter(s => new Date(s.checkedAt) >= cutoffDate);
  
  if (recentStatuses.length === 0) return 100;
  
  const upCount = recentStatuses.filter(s => s.isUp).length;
  return Math.round((upCount / recentStatuses.length) * 10000) / 100;
}

// Public endpoint to get all active sites (no authentication required)
router.get('/all-sites', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get all active sites with their latest status
    const sites = await prisma.site.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            companyName: true,
            themeSettings: {
              select: {
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                textPrimary: true,
                textSecondary: true,
              }
            }
          }
        },
        statuses: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            isUp: true,
            pingIsUp: true,
            httpIsUp: true,
            dnsIsUp: true,
            checkedAt: true,
            pingResponseTime: true,
            httpResponseTime: true,
            dnsResponseTime: true,
            hasSsl: true,
            sslDaysUntilExpiry: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
    });

    res.json({ sites });
  } catch (error) {
    console.error('Failed to fetch all sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Public individual site endpoint (no authentication required)
router.get('/all-sites/:id', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;

    console.log(id);
    
    // Get specific site with comprehensive status data
    const site = await prisma.site.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        checkInterval: true,
        user: {
          select: {
            companyName: true,
            email: true,
            themeSettings: {
              select: {
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                textPrimary: true,
                textSecondary: true,
              }
            }
          }
        },
        statuses: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 100, // Get more statuses for incident analysis
          select: {
            id: true,
            checkedAt: true,
            workerId: true,
            
            // Overall Status
            isUp: true,
            pingIsUp: true,
            httpIsUp: true,
            dnsIsUp: true,
            
            // Response Times
            pingResponseTime: true,
            httpResponseTime: true,
            dnsResponseTime: true,
            
            // TCP Check Information
            tcpChecks: true,
            
            // DNS Information
            dnsNameservers: true,
            dnsRecords: true,
            
            // SSL Information
            hasSsl: true,
            sslValidFrom: true,
            sslValidTo: true,
            sslIssuer: true,
            sslDaysUntilExpiry: true,
          }
        }
      },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Calculate uptime metrics
    const uptime30Days = calculateUptime(site.statuses, 30);
    const uptime7Days = calculateUptime(site.statuses, 7);
    const uptime24Hours = calculateUptime(site.statuses, 1);

    // Build incidents for the past 7 days
    const incidents = buildIncidents(site.statuses, 7);

    // Get current response time
    const latestStatus = site.statuses[0];
    const currentResponseTime = latestStatus?.httpResponseTime || latestStatus?.pingResponseTime || null;

    // Get AI diagnostics and predictive analysis if available
    let aiDiagnostics = null;
    let aiPredictiveAnalysis = null;
    try {
      const aiHealthStatus = await kimiPredictiveService.getHealthStatus();
      if (aiHealthStatus.available) {
        // Get AI health analysis
        const aiAnalysis = await kimiPredictiveService.analyzeSiteHealth(id);
        aiDiagnostics = {
          diagnosis: aiAnalysis.diagnosis,
          severity: aiAnalysis.severity,
          recommendations: aiAnalysis.recommendations,
          confidence: aiAnalysis.confidence
        };

        // Get AI predictive analysis
        const aiPrediction = await kimiPredictiveService.predictSiteStatus(id, '24h');
        aiPredictiveAnalysis = {
          predictedStatus: aiPrediction.predictedStatus,
          confidence: aiPrediction.confidence,
          timeframe: aiPrediction.timeframe,
          riskFactors: aiPrediction.riskFactors,
          recommendations: aiPrediction.recommendations,
          predictedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('AI diagnostics not available:', error);
    }

    // Determine overall status and color
    let overallStatus = 'operational';
    let statusColor = 'green';
    let statusMessage = 'All systems operational';

    if (!latestStatus?.isUp) {
      overallStatus = 'outage';
      statusColor = 'red';
      statusMessage = 'Service currently unavailable';
    } else if (incidents.length > 0 && incidents[0].end === null) {
      overallStatus = 'degraded';
      statusColor = 'yellow';
      statusMessage = 'Service experiencing issues';
    } else if (uptime24Hours < 99) {
      overallStatus = 'degraded';
      statusColor = 'yellow';
      statusMessage = 'Service experiencing intermittent issues';
    }

    // Enhanced response with all required data
    const enhancedSite = {
      ...site,
      status: {
        overall: overallStatus,
        color: statusColor,
        message: statusMessage,
        lastChecked: latestStatus?.checkedAt,
        currentResponseTime,
        uptime: {
          '24h': uptime24Hours,
          '7d': uptime7Days,
          '30d': uptime30Days
        }
      },
      incidents: incidents.slice(0, 10), // Last 10 incidents
      aiDiagnostics,
      aiPredictiveAnalysis,
      performance: {
        averageResponseTime: site.statuses
          .filter(s => s.httpResponseTime)
          .reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / 
          site.statuses.filter(s => s.httpResponseTime).length || 0,
        sslStatus: latestStatus?.hasSsl ? 'valid' : 'invalid',
        sslExpiryDays: latestStatus?.sslDaysUntilExpiry
      },
      // Comprehensive status details
      detailedStatus: {
        overall: {
          isUp: latestStatus?.isUp || false,
          workerId: latestStatus?.workerId || 'unknown'
        },
        ping: {
          isUp: latestStatus?.pingIsUp || false,
          responseTime: latestStatus?.pingResponseTime || null
        },
        http: {
          isUp: latestStatus?.httpIsUp || false,
          responseTime: latestStatus?.httpResponseTime || null
        },
        dns: {
          isUp: latestStatus?.dnsIsUp || false,
          responseTime: latestStatus?.dnsResponseTime || null,
          nameservers: latestStatus?.dnsNameservers || [],
          records: latestStatus?.dnsRecords || null
        },
        ssl: {
          hasSsl: latestStatus?.hasSsl || false,
          validFrom: latestStatus?.sslValidFrom || null,
          validTo: latestStatus?.sslValidTo || null,
          issuer: latestStatus?.sslIssuer || null,
          daysUntilExpiry: latestStatus?.sslDaysUntilExpiry || null
        },
        tcp: {
          checks: latestStatus?.tcpChecks || null
        }
      }
    };

    res.json({ site: enhancedSite });
  } catch (error) {
    console.error('Failed to fetch site details:', error);
    res.status(500).json({ error: 'Failed to fetch site details' });
  }
});

export default router; 