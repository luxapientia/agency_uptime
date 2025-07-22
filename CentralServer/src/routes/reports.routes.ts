import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import * as pdf from 'html-pdf-node';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { kimiPredictiveService } from '../services/kimiPredictive.service';

const prisma = new PrismaClient();
const router = Router();

// Helper function to convert image file to base64
async function getBase64FromPath(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(__dirname, '../../public', filePath);
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      return imageBuffer.toString('base64');
    } else {
      // Fallback to default logo if file doesn't exist
      const defaultLogoPath = path.join(__dirname, '../../public/logo.png');
      if (fs.existsSync(defaultLogoPath)) {
        const imageBuffer = fs.readFileSync(defaultLogoPath);
        return imageBuffer.toString('base64');
      }
      return '';
    }
  } catch (error) {
    console.error('Error reading logo file:', error);
    return '';
  }
}

interface SiteStatusWithMetrics {
  id: string;
  checkedAt: Date;
  siteId: string;
  workerId: string;
  isUp: boolean;
  pingIsUp: boolean;
  httpIsUp: boolean;
  dnsIsUp: boolean;
  pingResponseTime: number | null;
  httpResponseTime: number | null;
  dnsResponseTime: number | null;
  tcpChecks: any;
  dnsNameservers: string[];
  dnsRecords: any;
  hasSsl: boolean;
  sslValidFrom: Date | null;
  sslValidTo: Date | null;
  sslIssuer: string | null;
  sslDaysUntilExpiry: number | null;
}

router.get('/pdf', (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const siteId = req.query.siteId as string;
    const tz = typeof req.query.tz === 'string' ? req.query.tz : 'UTC';
    const reportType = (req.query.type as string) || 'current'; // 'current' or 'history'
    const historyDays = parseInt(req.query.days as string) || 7;

    if (!siteId) {
      return res.status(400).json({ message: 'Missing siteId query parameter' });
    }

    // Fetch the site with all related data
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        user: {
          include: {
            themeSettings: true
          }
        },
        notificationSettings: true
      }
    });

    // Verify the site belongs to the user
    if (!site || site.userId !== req.user.id) {
      return res.status(404).json({ message: 'Site not found or access denied' });
    }

    // Get user's theme settings for branding
    const themeSettings = site.user.themeSettings || {
      primaryColor: '#1976d2',
      secondaryColor: '#9c27b0',
      successColor: '#2e7d32',
      errorColor: '#d32f2f',
      warningColor: '#ed6c02',
      infoColor: '#0288d1',
      textPrimary: '#000000',
      textSecondary: '#666666',
      logo: 'logo.png',
      fontPrimary: 'Roboto'
    };

    // Fetch status data based on report type
    let statusData: SiteStatusWithMetrics[] = [];
    let reportTitle = '';
    let reportSubtitle = '';

    if (reportType === 'history') {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - historyDays);

      statusData = await prisma.siteStatus.findMany({
        where: {
          siteId,
          checkedAt: {
            gte: dateFrom
          }
        },
        orderBy: { checkedAt: 'desc' },
        take: 1000 // Limit to avoid memory issues
      });

      reportTitle = `${historyDays}-Day Status History Report`;
      reportSubtitle = `Historical performance data for the last ${historyDays} days`;
    } else {
      // Current status report
      statusData = await prisma.siteStatus.findMany({
        where: { siteId },
        orderBy: { checkedAt: 'desc' },
        take: 50 // Latest 50 entries
      });

      reportTitle = 'Site Status Report';
      reportSubtitle = 'Latest monitoring data and performance metrics';
    }

    // Group status data by worker
    const statusByWorker: Record<string, SiteStatusWithMetrics[]> = {};
    const latestByWorker: Record<string, SiteStatusWithMetrics> = {};

    statusData.forEach(status => {
      if (!statusByWorker[status.workerId]) {
        statusByWorker[status.workerId] = [];
      }
      statusByWorker[status.workerId].push(status);

      if (!latestByWorker[status.workerId] ||
        status.checkedAt > latestByWorker[status.workerId].checkedAt) {
        latestByWorker[status.workerId] = status;
      }
    });

    // Calculate uptime statistics
    const calculateUptimeStats = (statuses: SiteStatusWithMetrics[]) => {
      if (statuses.length === 0) return { uptime: 0, totalChecks: 0, avgResponseTime: 0 };

      const upCount = statuses.filter(s => s.isUp).length;
      const totalChecks = statuses.length;
      const uptime = (upCount / totalChecks) * 100;

      const responseTimes = statuses
        .filter(s => s.httpResponseTime !== null)
        .map(s => s.httpResponseTime as number);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      return { uptime: Math.round(uptime * 100) / 100, totalChecks, avgResponseTime: Math.round(avgResponseTime) };
    };

    const consensus = latestByWorker['consensus_worker'];
    const workerIds = Object.keys(latestByWorker).filter(w => w !== 'consensus_worker');

    // Helper to format date in user's timezone
    function formatDate(date: Date | string | null | undefined, includeTime = true) {
      if (!date) return '-';
      try {
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          timeZone: tz || 'UTC'
        };

        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.hour12 = false;
        }

        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
      } catch {
        return new Date(date).toLocaleString();
      }
    }

    // Helper to format response time
    function formatResponseTime(time: number | null) {
      if (time === null || time === undefined) return '-';
      return `${Math.round(time)}ms`;
    }

    // Helper to get status color
    function getStatusColor(isUp: boolean) {
      return isUp ? themeSettings.successColor : themeSettings.errorColor;
    }

    // Helper to format uptime percentage
    function formatUptime(uptime: number) {
      if (uptime >= 99.9) return `<span style="color: ${themeSettings.successColor}; font-weight: bold;">${uptime}%</span>`;
      if (uptime >= 95) return `<span style="color: ${themeSettings.warningColor}; font-weight: bold;">${uptime}%</span>`;
      return `<span style="color: ${themeSettings.errorColor}; font-weight: bold;">${uptime}%</span>`;
    }

    // Calculate overall statistics
    const overallStats = calculateUptimeStats(statusData);
    const consensusStats = consensus ? calculateUptimeStats(statusByWorker['consensus_worker'] || []) : null;

    // Fetch AI analysis data
    let aiAnalysis = null;
    let aiPrediction = null;
    let aiHealthStatus = null;

    try {
      // Get AI service health status
      aiHealthStatus = await kimiPredictiveService.getHealthStatus();

      // Only fetch analysis if AI service is available
      if (aiHealthStatus.available) {
        try {
          aiAnalysis = await kimiPredictiveService.analyzeSiteHealth(siteId);
        } catch (error) {
          console.log('AI analysis failed:', error);
        }

        try {
          aiPrediction = await kimiPredictiveService.predictSiteStatus(siteId, '24h');
        } catch (error) {
          console.log('AI prediction failed:', error);
        }
      }
    } catch (error) {
      console.log('AI service health check failed:', error);
    }

    // Build comprehensive HTML report
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: '${themeSettings.fontPrimary}', 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 30px; 
            background:rgb(255, 255, 255);
            color: ${themeSettings.textPrimary};
            line-height: 1.6;
          }
          
          /* Page break controls */
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .page-break-avoid { page-break-inside: avoid; }
          .keep-together { 
            page-break-inside: avoid; 
            break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
          
          /* Keep sections together */
          .section { 
            page-break-inside: avoid; 
            break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
          
          /* Allow page breaks only between major sections */
          .section + .section {
            page-break-before: auto;
          }
          
          /* Keep worker cards together */
          .worker-card {
            page-break-inside: avoid;
            break-inside: avoid;
            orphans: 2;
            widows: 2;
          }
          
          /* Keep tables together when possible */
          table {
            page-break-inside: auto;
          }
          
          /* Keep table headers with content */
          thead {
            display: table-header-group;
          }
          
          /* Avoid orphaned headers */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Keep at least 3 lines together after headers */
          h1 + *, h2 + *, h3 + * {
            page-break-before: avoid;
            break-before: avoid;
          }
          
          /* Keep info grids together */
          .info-grid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Keep alert boxes together */
          .alert-box {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Keep performance analysis together */
          .performance-analysis {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Force page break before regional workers */
          .regional-workers-section {
            page-break-before: always;
          }
          
          .header {
            background: linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.secondaryColor});
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .header h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px; 
            font-weight: 300;
          }
          
          .header .subtitle { 
            font-size: 1.2em; 
            opacity: 0.9; 
            margin-bottom: 20px;
          }
          
          .header .company-info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          
          .site-overview {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-left: 5px solid ${themeSettings.primaryColor};
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .site-overview h2 {
            color: ${themeSettings.primaryColor};
            font-size: 1.8em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
          }
          
          .site-overview h2 {
            color: ${themeSettings.primaryColor};
            font-size: 1.8em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
          }
          
          .site-overview .icon {
            margin-right: 10px;
            font-size: 1.2em;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .info-item {
            padding: 15px;
            background:rgb(255, 255, 255);
            border-radius: 8px;
            border-left: 3px solid ${themeSettings.infoColor};
          }
          
          .info-item .label {
            font-weight: 600;
            color: ${themeSettings.textSecondary};
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-item .value {
            font-size: 1.1em;
            margin-top: 5px;
          }
          
          .stats-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          
          .stat-card {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 10px;
            border: 1px solid #dee2e6;
          }
          
          .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .stat-label {
            color: ${themeSettings.textSecondary};
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .section-title {
            color: ${themeSettings.primaryColor};
            font-size: 1.6em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            border-bottom: 2px solid ${themeSettings.primaryColor}20;
            padding-bottom: 10px;
          }
          
          .section-title .icon {
            margin-right: 10px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th {
            background: ${themeSettings.primaryColor};
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          td {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: top;
          }
          
          tr:nth-child(even) td {
            background: #fafafa;
          }
          
          tr:hover td {
            background: #f0f8ff;
          }
          
          .status-up { 
            color: ${themeSettings.successColor}; 
            font-weight: bold; 
            display: flex; 
            align-items: center;
          }
          
          .status-down { 
            color: ${themeSettings.errorColor}; 
            font-weight: bold; 
            display: flex; 
            align-items: center;
          }
          
          .status-icon {
            margin-right: 5px;
            font-size: 1.1em;
          }
          
          .worker-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          .worker-card {
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 20px;
            background: linear-gradient(135deg, #fff, #f8f9fa);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 15px;
          }
          
          /* Ensure worker grid doesn't break awkwardly */
          .worker-grid {
            page-break-inside: auto;
          }
          
          /* Keep first worker card with the header */
          .worker-card:first-child {
            page-break-before: avoid;
          }
          
          .worker-title {
            font-weight: bold;
            color: ${themeSettings.primaryColor};
            font-size: 1.2em;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${themeSettings.primaryColor}20;
            display: flex;
            align-items: center;
          }
          
          .worker-title .icon {
            margin-right: 8px;
          }
          
          .metric-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          
          .metric-label {
            font-weight: 500;
            color: ${themeSettings.textSecondary};
          }
          
          .metric-value {
            font-weight: 600;
          }
          
          .ssl-valid { color: ${themeSettings.successColor}; font-weight: bold; }
          .ssl-invalid { color: ${themeSettings.errorColor}; font-weight: bold; }
          .ssl-warning { color: ${themeSettings.warningColor}; font-weight: bold; }
          
          .dns-list, .tcp-list {
            list-style: none;
            padding: 0;
            margin: 5px 0;
          }
          
          .dns-list li, .tcp-list li {
            padding: 3px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .dns-list li:last-child, .tcp-list li:last-child {
            border-bottom: none;
          }
          
          .alert-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid ${themeSettings.warningColor};
          }
          
          .alert-box.error {
            background: #f8d7da;
            border-color: #f5c6cb;
            border-left-color: ${themeSettings.errorColor};
          }
          
          .alert-box.success {
            background: #d4edda;
            border-color: #c3e6cb;
            border-left-color: ${themeSettings.successColor};
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: ${themeSettings.textSecondary};
            font-size: 0.9em;
          }
          
          .response-time-good { color: ${themeSettings.successColor}; }
          .response-time-slow { color: ${themeSettings.warningColor}; }
          .response-time-bad { color: ${themeSettings.errorColor}; }
          
          @media print {
            body { background: white; }
            .section, .site-overview, .stats-section { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
        `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${site.user.companyName} Logo" style="max-height: 60px; max-width: 200px; margin-right: 20px;">` :
        `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${site.user.companyName} Logo" style="max-height: 60px; max-width: 200px; margin-right: 20px;">`
      }
            <div>
              <h1 style="margin: 0; color: white;">${reportTitle}</h1>
              <div class="subtitle">${reportSubtitle}</div>
            </div>
          </div>
          <div class="company-info">
            <strong>${site.user.companyName}</strong><br>
          </div>
        </div>

        <div class="site-overview">
          <h2><span class="icon">🌐</span>Site Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Site Name</div>
              <div class="value">${site.name}</div>
            </div>
            <div class="info-item">
              <div class="label">URL</div>
              <div class="value">${site.url}</div>
            </div>
            <div class="info-item">
              <div class="label">Check Interval</div>
              <div class="value">${site.checkInterval} minutes</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div class="value">${site.isActive ? '✅ Active' : '❌ Inactive'}</div>
            </div>
            <div class="info-item">
              <div class="label">Created</div>
              <div class="value">${formatDate(site.createdAt, false)}</div>
            </div>
            <div class="info-item">
              <div class="label">Notifications</div>
              <div class="value">${site.notificationSettings.length > 0 ?
        site.notificationSettings.map(n => n.type).join(', ') :
        'None configured'}</div>
            </div>
          </div>
        </div>

        ${aiHealthStatus && aiHealthStatus.available ? `
          <div class="section keep-together">
            <h2 class="section-title"><span class="icon">🤖</span>AI-Powered Analysis</h2>
            
            ${aiAnalysis ? `
            <div style="margin-bottom: 30px;">
              <h3 style="color: ${themeSettings.primaryColor}; margin-bottom: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🔍</span>Health Diagnosis
              </h3>
              
              <div class="info-grid" style="margin-bottom: 20px;">
                <div class="info-item">
                  <div class="label">AI Service Status</div>
                  <div class="value status-up">✅ Available (${aiHealthStatus.model})</div>
                </div>
                <div class="info-item">
                  <div class="label">Analysis Confidence</div>
                  <div class="value">${Math.round(aiAnalysis.confidence * 100)}%</div>
                </div>
                <div class="info-item">
                  <div class="label">Severity Level</div>
                  <div class="value ${aiAnalysis.severity === 'critical' ? 'status-down' : aiAnalysis.severity === 'high' ? 'ssl-warning' : aiAnalysis.severity === 'medium' ? 'response-time-slow' : 'status-up'}">
                    ${aiAnalysis.severity === 'critical' ? '🔴 Critical' :
            aiAnalysis.severity === 'high' ? '🟠 High' :
              aiAnalysis.severity === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </div>
                </div>
                <div class="info-item">
                  <div class="label">AI Tokens Used</div>
                  <div class="value">${aiAnalysis.tokenUsage.total} tokens</div>
                </div>
              </div>
              
              <div style="background: ${aiAnalysis.severity === 'critical' ? '#f8d7da' : aiAnalysis.severity === 'high' ? '#fff3cd' : aiAnalysis.severity === 'medium' ? '#e3f2fd' : '#d4edda'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${aiAnalysis.severity === 'critical' ? themeSettings.errorColor : aiAnalysis.severity === 'high' ? themeSettings.warningColor : aiAnalysis.severity === 'medium' ? themeSettings.infoColor : themeSettings.successColor}; margin-bottom: 20px;">
                <strong>🤖 AI Diagnosis:</strong><br>
                ${aiAnalysis.diagnosis}
              </div>
              
              ${aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="color: ${themeSettings.primaryColor}; margin-bottom: 15px;">💡 AI Recommendations</h4>
                <ul style="padding-left: 20px; margin: 0;">
                  ${aiAnalysis.recommendations.map((rec: string) => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${aiPrediction ? `
            <div style="page-break-before: always;">
              <h3 style="color: ${themeSettings.primaryColor}; margin-bottom: 20px; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🔮</span>24-Hour Prediction
              </h3>
              
              <div class="info-grid" style="margin-bottom: 20px;">
                <div class="info-item">
                  <div class="label">Predicted Status</div>
                  <div class="value ${aiPrediction.predictedStatus === 'up' ? 'status-up' : aiPrediction.predictedStatus === 'degraded' ? 'ssl-warning' : 'status-down'}">
                    ${aiPrediction.predictedStatus === 'up' ? '✅ Up' :
            aiPrediction.predictedStatus === 'degraded' ? '⚠️ Degraded' : '❌ Down'}
                  </div>
                </div>
                <div class="info-item">
                  <div class="label">Prediction Confidence</div>
                  <div class="value">${Math.round(aiPrediction.confidence * 100)}%</div>
                </div>
                <div class="info-item">
                  <div class="label">Timeframe</div>
                  <div class="value">${aiPrediction.timeframe}</div>
                </div>
                <div class="info-item">
                  <div class="label">AI Tokens Used</div>
                  <div class="value">${aiPrediction.tokenUsage.total} tokens</div>
                </div>
              </div>
              
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid ${themeSettings.infoColor}; margin-bottom: 20px;">
                <strong>🔮 AI Prediction Reasoning:</strong><br>
                ${aiPrediction.reasoning}
              </div>
              
              ${aiPrediction.recommendations && aiPrediction.recommendations.length > 0 ? `
              <div>
                <h4 style="color: ${themeSettings.primaryColor}; margin-bottom: 15px;">🚀 Predictive Recommendations</h4>
                <ul style="padding-left: 20px; margin: 0;">
                  ${aiPrediction.recommendations.map((rec: string) => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="section keep-together">
            <h2 class="section-title"><span class="icon">🤖</span>AI-Powered Analysis</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${themeSettings.textSecondary};">
              <strong>ℹ️ AI Service Status:</strong><br>
              AI-powered analysis is currently unavailable. This may be due to service configuration or temporary unavailability.
            </div>
          </div>
          `}
  
          

        ${consensus ? `
        <div class="section keep-together" style="margin-top: 10px;">
          <h2 class="section-title"><span class="icon">🎯</span>Current Consensus Status</h2>
          
          <div class="info-grid" style="margin-bottom: 20px;">
            <div class="info-item">
              <div class="label">Overall Status</div>
              <div class="value ${consensus.isUp ? 'status-up' : 'status-down'}">
                ${consensus.isUp ? '✅ Site is Online' : '❌ Site is Offline'}
              </div>
            </div>
            <div class="info-item">
              <div class="label">Last Checked</div>
              <div class="value">${formatDate(consensus.checkedAt)}</div>
            </div>
            <div class="info-item">
              <div class="label">Worker ID</div>
              <div class="value">${consensus.workerId}</div>
            </div>
            <div class="info-item">
              <div class="label">Check ID</div>
              <div class="value" style="font-family: monospace; font-size: 0.9em;">${consensus.id}</div>
            </div>
          </div>
          ${consensusStats ? `
          <div class="alert-box ${consensus.isUp ? 'success' : 'error'}">
            <strong>Site Status: ${consensus.isUp ? '✅ Online' : '❌ Offline'}</strong><br>
            Last checked: ${formatDate(consensus.checkedAt)}<br>
            ${consensusStats ? `Uptime: ${formatUptime(consensusStats.uptime)} (${consensusStats.totalChecks} checks)` : ''}
          </div>
          ` : ''}
          
          <h3 style="color: ${themeSettings.primaryColor}; margin: 20px 0 15px 0;">📊 Performance Metrics</h3>
          <table>
            <thead>
              <tr>
                <th>Test Type</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Performance Rating</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>🏓 Ping Test</strong></td>
                <td><span class="${consensus.pingIsUp ? 'status-up' : 'status-down'}">
                  ${consensus.pingIsUp ? '✅ Up' : '❌ Down'}
                </span></td>
                <td class="${consensus.pingResponseTime && consensus.pingResponseTime < 100 ? 'response-time-good' : consensus.pingResponseTime && consensus.pingResponseTime < 500 ? 'response-time-slow' : 'response-time-bad'}">
                  ${formatResponseTime(consensus.pingResponseTime)}
                </td>
                <td>
                  ${consensus.pingResponseTime ?
          consensus.pingResponseTime < 50 ? '🟢 Excellent' :
            consensus.pingResponseTime < 100 ? '🟡 Good' :
              consensus.pingResponseTime < 200 ? '🟠 Fair' :
                '🔴 Poor' : 'N/A'
        }
                </td>
                <td>Network connectivity and latency test</td>
              </tr>
              <tr>
                <td><strong>🌐 HTTP Test</strong></td>
                <td><span class="${consensus.httpIsUp ? 'status-up' : 'status-down'}">
                  ${consensus.httpIsUp ? '✅ Up' : '❌ Down'}
                </span></td>
                <td class="${consensus.httpResponseTime && consensus.httpResponseTime < 1000 ? 'response-time-good' : consensus.httpResponseTime && consensus.httpResponseTime < 3000 ? 'response-time-slow' : 'response-time-bad'}">
                  ${formatResponseTime(consensus.httpResponseTime)}
                </td>
                <td>
                  ${consensus.httpResponseTime ?
          consensus.httpResponseTime < 500 ? '🟢 Excellent' :
            consensus.httpResponseTime < 1000 ? '🟡 Good' :
              consensus.httpResponseTime < 2000 ? '🟠 Fair' :
                '🔴 Poor' : 'N/A'
        }
                </td>
                <td>Web server response time and availability</td>
              </tr>
              <tr>
                <td><strong>🔍 DNS Test</strong></td>
                <td><span class="${consensus.dnsIsUp ? 'status-up' : 'status-down'}">
                  ${consensus.dnsIsUp ? '✅ Up' : '❌ Down'}
                </span></td>
                <td class="${consensus.dnsResponseTime && consensus.dnsResponseTime < 100 ? 'response-time-good' : consensus.dnsResponseTime && consensus.dnsResponseTime < 500 ? 'response-time-slow' : 'response-time-bad'}">
                  ${formatResponseTime(consensus.dnsResponseTime)}
                </td>
                <td>
                  ${consensus.dnsResponseTime ?
          consensus.dnsResponseTime < 50 ? '🟢 Excellent' :
            consensus.dnsResponseTime < 100 ? '🟡 Good' :
              consensus.dnsResponseTime < 200 ? '🟠 Fair' :
                '🔴 Poor' : 'N/A'
        }
                </td>
                <td>Domain name resolution speed</td>
              </tr>
            </tbody>
          </table>
          
          <div class="performance-analysis" style="margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid ${themeSettings.infoColor};">
            <strong>📈 Performance Analysis:</strong><br>
            • <strong>Network Latency:</strong> ${consensus.pingResponseTime ?
          consensus.pingResponseTime < 50 ? 'Excellent - Very low latency' :
            consensus.pingResponseTime < 100 ? 'Good - Acceptable latency' :
              consensus.pingResponseTime < 200 ? 'Fair - Higher than ideal latency' :
                'Poor - High latency affecting performance' : 'Unknown'
        }<br>
            • <strong>Server Response:</strong> ${consensus.httpResponseTime ?
          consensus.httpResponseTime < 500 ? 'Excellent - Fast server response' :
            consensus.httpResponseTime < 1000 ? 'Good - Normal server response' :
              consensus.httpResponseTime < 2000 ? 'Fair - Slow server response' :
                'Poor - Very slow server response' : 'Unknown'
        }<br>
            • <strong>DNS Performance:</strong> ${consensus.dnsResponseTime ?
          consensus.dnsResponseTime < 50 ? 'Excellent - Fast DNS resolution' :
            consensus.dnsResponseTime < 100 ? 'Good - Normal DNS resolution' :
              consensus.dnsResponseTime < 200 ? 'Fair - Slow DNS resolution' :
                'Poor - Very slow DNS resolution' : 'Unknown'
        }
          </div>

          ${consensus.hasSsl ? `
          <div class="keep-together" style="margin-top: 20px;">
            <h3 style="color: ${themeSettings.primaryColor}; margin-bottom: 10px;">🔒 SSL Certificate Analysis</h3>
            
            <div class="info-grid" style="margin-bottom: 20px;">
              <div class="info-item">
                <div class="label">SSL Status</div>
                <div class="value ssl-valid">✅ Valid & Active</div>
              </div>
              <div class="info-item">
                <div class="label">Certificate Issuer</div>
                <div class="value">${consensus.sslIssuer || 'Unknown Certificate Authority'}</div>
              </div>
              <div class="info-item">
                <div class="label">Valid From</div>
                <div class="value">${formatDate(consensus.sslValidFrom, false)}</div>
              </div>
              <div class="info-item">
                <div class="label">Expiration Date</div>
                <div class="value ${consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 30 ? 'ssl-warning' : 'ssl-valid'}">
                  ${formatDate(consensus.sslValidTo, false)}
                </div>
              </div>
              <div class="info-item">
                <div class="label">Days Until Expiry</div>
                <div class="value ${consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 30 ? 'ssl-warning' : consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 90 ? 'response-time-slow' : 'ssl-valid'}">
                  ${consensus.sslDaysUntilExpiry !== null ? `${consensus.sslDaysUntilExpiry} days` : 'Unknown'}
                </div>
              </div>
              <div class="info-item">
                <div class="label">Certificate Age</div>
                <div class="value">
                  ${consensus.sslValidFrom ?
            `${Math.floor((new Date().getTime() - new Date(consensus.sslValidFrom).getTime()) / (1000 * 60 * 60 * 24))} days old` :
            'Unknown'
          }
                </div>
              </div>
            </div>
            
            <div style="margin-top: 15px; padding: 15px; background: ${consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 30 ? '#f8d7da' : '#d4edda'}; border-radius: 8px; border-left: 4px solid ${consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 30 ? themeSettings.errorColor : themeSettings.successColor};">
              <strong>🔍 SSL Certificate Analysis:</strong><br>
              ${consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 30 ?
            `⚠️ <strong>Certificate expires in ${consensus.sslDaysUntilExpiry} days!</strong> Please renew the SSL certificate to avoid service interruption.` :
            consensus.sslDaysUntilExpiry && consensus.sslDaysUntilExpiry < 90 ?
              `⚠️ <strong>Certificate expires in ${consensus.sslDaysUntilExpiry} days.</strong> Consider planning for renewal.` :
              `✅ <strong>Certificate is valid for ${consensus.sslDaysUntilExpiry} more days.</strong> No immediate action required.`
          }<br>
              • <strong>Issuer:</strong> ${consensus.sslIssuer || 'Unknown'}<br>
              • <strong>Security Level:</strong> ${consensus.sslIssuer && consensus.sslIssuer.includes('Let\'s Encrypt') ? 'Standard (Let\'s Encrypt)' :
            consensus.sslIssuer && consensus.sslIssuer.includes('DigiCert') ? 'Premium (DigiCert)' :
              consensus.sslIssuer && consensus.sslIssuer.includes('Comodo') ? 'Premium (Comodo)' :
                'Standard Certificate Authority'}
            </div>
          </div>
          ` : `
          <div class="alert-box error" style="margin-top: 20px;">
            <strong>⚠️ SSL Certificate Not Found</strong><br>
            This site does not have a valid SSL certificate. This poses security risks and may affect user trust.<br>
            <strong>Recommendation:</strong> Enable HTTPS by installing an SSL certificate from a trusted Certificate Authority.
          </div>
          `}

          ${consensus.dnsNameservers && consensus.dnsNameservers.length > 0 ? `
          <div class="keep-together" style="margin-top: 20px;">
            <h3 style="color: ${themeSettings.primaryColor}; margin-bottom: 10px;">🌐 DNS Configuration</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">DNS Resolution Status</div>
                <div class="value ${consensus.dnsIsUp ? 'status-up' : 'status-down'}">
                  ${consensus.dnsIsUp ? '✅ Resolved Successfully' : '❌ Resolution Failed'}
                </div>
              </div>
              <div class="info-item">
                <div class="label">DNS Response Time</div>
                <div class="value ${consensus.dnsResponseTime && consensus.dnsResponseTime < 100 ? 'response-time-good' : consensus.dnsResponseTime && consensus.dnsResponseTime < 500 ? 'response-time-slow' : 'response-time-bad'}">
                  ${formatResponseTime(consensus.dnsResponseTime)}
                </div>
              </div>
              <div class="info-item">
                <div class="label">Nameserver Count</div>
                <div class="value">${consensus.dnsNameservers.length} servers</div>
              </div>
            </div>
            
            <div class="info-item" style="margin-top: 15px;">
              <div class="label">Nameservers</div>
              <div class="value">
                <ul class="dns-list">
                  ${consensus.dnsNameservers.map((ns: string, index: number) =>
                  `<li><strong>NS${index + 1}:</strong> ${ns}</li>`
                ).join('')}
                </ul>
              </div>
            </div>
            
            ${consensus.dnsRecords ? `
            <div class="info-item" style="margin-top: 15px;">
              <div class="label">DNS Records</div>
              <div class="value">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.9em; max-height: 300px; overflow-y: auto;">
                  <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(consensus.dnsRecords, null, 2)}</pre>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="alert-box error" style="margin-top: 20px;">
            <strong>⚠️ DNS Information Not Available</strong><br>
            No DNS configuration data is available for this site.
          </div>
          `}

          ${consensus.tcpChecks && Array.isArray(consensus.tcpChecks) && consensus.tcpChecks.length > 0 ? `
          <div class="keep-together" style="margin-top: 20px;">
            <h3 style="color: ${themeSettings.primaryColor}; margin-bottom: 10px;">🔌 TCP Port Analysis</h3>
            
            <div class="info-grid" style="margin-bottom: 20px;">
              <div class="info-item">
                <div class="label">Total Ports Checked</div>
                <div class="value">${consensus.tcpChecks.length} ports</div>
              </div>
              <div class="info-item">
                <div class="label">Open Ports</div>
                <div class="value">${consensus.tcpChecks.filter((tcp: any) => tcp.isUp).length} open</div>
              </div>
              <div class="info-item">
                <div class="label">Closed Ports</div>
                <div class="value">${consensus.tcpChecks.filter((tcp: any) => !tcp.isUp).length} closed</div>
              </div>
              <div class="info-item">
                <div class="label">Average Response</div>
                <div class="value">${formatResponseTime(
                  consensus.tcpChecks
                    .filter((tcp: any) => tcp.responseTime)
                    .reduce((sum: number, tcp: any) => sum + (tcp.responseTime || 0), 0) /
                  consensus.tcpChecks.filter((tcp: any) => tcp.responseTime).length
                )}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>Service</th>
                  <th>Description</th>
                  <th>Security</th>
                </tr>
              </thead>
              <tbody>
                ${consensus.tcpChecks.map((tcp: any) => {
                  const port = tcp.port;
                  const serviceInfo: Record<number, { name: string; desc: string; security: string }> = {
                    20: { name: 'FTP-DATA', desc: 'File Transfer Protocol Data', security: '⚠️ Unencrypted' },
                    21: { name: 'FTP', desc: 'File Transfer Protocol Control', security: '⚠️ Unencrypted' },
                    22: { name: 'SSH', desc: 'Secure Shell', security: '🔒 Encrypted' },
                    23: { name: 'TELNET', desc: 'Telnet Protocol', security: '❌ Unencrypted' },
                    25: { name: 'SMTP', desc: 'Simple Mail Transfer Protocol', security: '⚠️ Usually Unencrypted' },
                    53: { name: 'DNS', desc: 'Domain Name System', security: '⚠️ Unencrypted' },
                    80: { name: 'HTTP', desc: 'Hypertext Transfer Protocol', security: '❌ Unencrypted' },
                    110: { name: 'POP3', desc: 'Post Office Protocol v3', security: '⚠️ Usually Unencrypted' },
                    143: { name: 'IMAP', desc: 'Internet Message Access Protocol', security: '⚠️ Usually Unencrypted' },
                    443: { name: 'HTTPS', desc: 'HTTP over SSL/TLS', security: '🔒 Encrypted' },
                    993: { name: 'IMAPS', desc: 'IMAP over SSL/TLS', security: '🔒 Encrypted' },
                    995: { name: 'POP3S', desc: 'POP3 over SSL/TLS', security: '🔒 Encrypted' },
                    3306: { name: 'MySQL', desc: 'MySQL Database', security: '⚠️ Usually Unencrypted' },
                    5432: { name: 'PostgreSQL', desc: 'PostgreSQL Database', security: '⚠️ Usually Unencrypted' },
                    27017: { name: 'MongoDB', desc: 'MongoDB Database', security: '⚠️ Usually Unencrypted' },
                    6379: { name: 'Redis', desc: 'Redis Database', security: '⚠️ Usually Unencrypted' },
                    8080: { name: 'HTTP-ALT', desc: 'Alternative HTTP Port', security: '❌ Unencrypted' },
                    8443: { name: 'HTTPS-ALT', desc: 'Alternative HTTPS Port', security: '🔒 Encrypted' }
                  };

                  const service = serviceInfo[port] || {
                    name: 'Custom',
                    desc: 'Custom Application Port',
                    security: '❓ Unknown'
                  };

                  return `
                  <tr>
                    <td><strong>${port}</strong></td>
                    <td><span class="${tcp.isUp ? 'status-up' : 'status-down'}">
                      ${tcp.isUp ? '✅ Open' : '❌ Closed'}
                    </span></td>
                    <td class="${tcp.responseTime && tcp.responseTime < 100 ? 'response-time-good' : tcp.responseTime && tcp.responseTime < 500 ? 'response-time-slow' : 'response-time-bad'}">
                      ${formatResponseTime(tcp.responseTime)}
                    </td>
                    <td><strong>${service.name}</strong></td>
                    <td>${service.desc}</td>
                    <td>${service.security}</td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid ${themeSettings.warningColor};">
              <strong>🔍 Port Analysis Summary:</strong><br>
              • <strong>${consensus.tcpChecks.filter((tcp: any) => tcp.isUp).length} ports are open</strong> and accessible<br>
              • <strong>${consensus.tcpChecks.filter((tcp: any) => !tcp.isUp).length} ports are closed</strong> or filtered<br>
              • <strong>Security Recommendation:</strong> Only essential ports should be open. Consider closing unnecessary ports for better security.
            </div>
          </div>
          ` : `
          <div class="alert-box error" style="margin-top: 20px;">
            <strong>⚠️ TCP Port Information Not Available</strong><br>
            No TCP port scan data is available for this site.
          </div>
          `}
        </div>
        ` : `
        <div class="alert-box error">
          <strong>⚠️ No Consensus Data Available</strong><br>
          The consensus worker hasn't reported any status data yet. This may indicate a configuration issue or that monitoring has just started.
        </div>
        `}

        ${workerIds.length > 0 ? `
        <div class="section regional-workers-section">
          <h2 class="section-title"><span class="icon">🌍</span>Regional Worker Status</h2>
          <div class="worker-grid">
            ${workerIds.map(workerId => {
                  const status = latestByWorker[workerId];
                  const workerStats = calculateUptimeStats(statusByWorker[workerId] || []);
                  return `
              <div class="worker-card">
                <div class="worker-title">
                  <span class="icon">📍</span>
                  ${workerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div class="metric-row">
                  <span class="metric-label">Last Check:</span>
                  <span class="metric-value">${formatDate(status.checkedAt)}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Overall Status:</span>
                  <span class="metric-value ${status.isUp ? 'status-up' : 'status-down'}">
                    ${status.isUp ? '✅ Up' : '❌ Down'}
                  </span>
                </div>
                ${workerStats.totalChecks > 0 ? `
                <div class="metric-row">
                  <span class="metric-label">Uptime:</span>
                  <span class="metric-value">${formatUptime(workerStats.uptime)}</span>
                </div>
                ` : ''}
                <div class="metric-row">
                  <span class="metric-label">Ping:</span>
                  <span class="metric-value ${status.pingIsUp ? 'status-up' : 'status-down'}">
                    ${status.pingIsUp ? '✅' : '❌'} ${formatResponseTime(status.pingResponseTime)}
                  </span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">HTTP:</span>
                  <span class="metric-value ${status.httpIsUp ? 'status-up' : 'status-down'}">
                    ${status.httpIsUp ? '✅' : '❌'} ${formatResponseTime(status.httpResponseTime)}
                  </span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">DNS:</span>
                  <span class="metric-value ${status.dnsIsUp ? 'status-up' : 'status-down'}">
                    ${status.dnsIsUp ? '✅' : '❌'} ${formatResponseTime(status.dnsResponseTime)}
                  </span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">SSL:</span>
                  <span class="metric-value ${status.hasSsl ? 'ssl-valid' : 'ssl-invalid'}">
                    ${status.hasSsl ? '🔒 Valid' : '🔓 None'}
                  </span>
                </div>
              </div>
              `;
                }).join('')}
          </div>
        </div>
        ` : ''}
      <div class="footer" style="page-break-inside: avoid; break-inside: avoid;">
          <div style="border-top: 2px solid ${themeSettings.primaryColor}; padding-top: 20px; margin-top: 30px;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
        `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${site.user.companyName} Logo" style="max-height: 30px; max-width: 100px; margin-right: 10px;">` :
        `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${site.user.companyName} Logo" style="max-height: 30px; max-width: 100px; margin-right: 10px;">`
      }
              <span style="font-weight: bold; color: ${themeSettings.primaryColor};">${site.user.companyName}</span>
            </div>
            <p style="text-align: center; margin: 0; color: ${themeSettings.textSecondary};">
              Report generated by <strong>${site.user.companyName}</strong> monitoring system
            </p>
            <p style="text-align: center; margin-top: 10px; font-size: 0.8em; color: ${themeSettings.textSecondary};">
              This report contains ${statusData.length} monitoring data points${reportType === 'history' ? ` over ${historyDays} days` : ' from recent checks'}<br>
              For technical support or questions about this report, please contact your monitoring provider.
            </p>
          </div>
      </div>
        
      </body>
      </html>
    `;

    // Generate PDF with enhanced options
    const file = { content: html };
    const options = {
      format: 'A4' as const,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
          ${site.user.companyName} - ${site.name} Monitoring Report
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${formatDate(new Date(), false)}
        </div>
      `,
    };

    const pdfBuffer = await pdf.generatePdf(file, options) as unknown as Buffer;

    // Validate that we got a buffer
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new Error('PDF generation failed - invalid buffer returned');
    }

    // Set response headers
    const filename = `${site.name.replace(/[^a-zA-Z0-9]/g, '-')}-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      message: 'Failed to generate PDF report',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}) as any);

export default router;