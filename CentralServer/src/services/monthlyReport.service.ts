import { PrismaClient, SiteStatus } from '@prisma/client';
import { kimiPredictiveService } from './kimiPredictive.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

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

interface MonthlyReportOptions {
  userId: string;
  period: string; // Format: "YYYY-MM"
}

interface SiteMonthly {
  siteId: string;
  siteName: string;
  siteUrl: string;
  overallUptime: number;
  httpUptime: number;
  pingUptime: number;
  dnsUptime: number;
  avgLatencyMs: number | null;
  incidents: Array<{
    start: Date;
    end: Date | null;
    durationMin: number;
    layer: string;
    severity: string;
    siteName: string;
  }>;
  sslDaysUntilExpiry: number | null;
  lastIsUp: boolean | null;
}

interface AIAnalysis {
  diagnosis?: string;
  severity?: string;
  recommendations?: string[];
  predictedStatus?: 'up' | 'down' | 'degraded';
  predictionConfidence?: number;
  riskFactors?: string[];
}

class MonthlyReportService {
  /**
   * Generate monthly report HTML content
   */
  async generateMonthlyReportHTML(options: MonthlyReportOptions): Promise<string> {
    const { userId, period } = options;

    // Validate period format
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error('Invalid period. Expected format: YYYY-MM');
    }

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch sites for this user enabled for monthly reports
    const sites = await prisma.site.findMany({
      where: { userId, isActive: true, monthlyReport: true },
      orderBy: { name: 'asc' },
      include: {
        user: { include: { themeSettings: true } },
      },
    });

    if (sites.length === 0) {
      throw new Error('No sites enabled for monthly report for this user');
    }

    const themeUser = sites[0].user;
    const themeSettings = themeUser?.themeSettings || {
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
    } as any;

    // Aggregate data for each site
    const perSite: SiteMonthly[] = [];

    for (const site of sites) {
      const statuses = await prisma.siteStatus.findMany({
        where: {
          siteId: site.id,
          checkedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { checkedAt: 'asc' },
      });

      const totalChecks = statuses.length || 1;
      const overallUptime = Math.round((statuses.filter(s => s.isUp).length / totalChecks) * 10000) / 100;
      const httpUptime = Math.round((statuses.filter(s => s.httpIsUp).length / totalChecks) * 10000) / 100;
      const pingUptime = Math.round((statuses.filter(s => s.pingIsUp).length / totalChecks) * 10000) / 100;
      const dnsUptime = Math.round((statuses.filter(s => s.dnsIsUp).length / totalChecks) * 10000) / 100;

      const httpTimes = statuses.map(s => s.httpResponseTime).filter((t): t is number => t != null);
      const avgLatencyMs = httpTimes.length > 0 ? Math.round(httpTimes.reduce((a, b) => a + b, 0) / httpTimes.length) : null;

      const incidents = this.generateIncidents(statuses).map(i => ({
        start: i.startTime,
        end: i.endTime,
        durationMin: i.durationMin,
        layer: i.layer,
        severity: i.severity,
        siteName: site.name,
      }));

      const lastStatus = statuses[statuses.length - 1];
      perSite.push({
        siteId: site.id,
        siteName: site.name,
        siteUrl: site.url,
        overallUptime: isFinite(overallUptime) ? overallUptime : 0,
        httpUptime: isFinite(httpUptime) ? httpUptime : 0,
        pingUptime: isFinite(pingUptime) ? pingUptime : 0,
        dnsUptime: isFinite(dnsUptime) ? dnsUptime : 0,
        avgLatencyMs,
        incidents,
        sslDaysUntilExpiry: lastStatus?.sslDaysUntilExpiry ?? null,
        lastIsUp: lastStatus ? !!lastStatus.isUp : null,
      });
    }

    // Executive summary
    const totalSites = perSite.length;
    const overallUptimeAvg = totalSites > 0 ? Math.round((perSite.reduce((a, s) => a + s.overallUptime, 0) / totalSites) * 100) / 100 : 0;
    const totalIncidents = perSite.reduce((a, s) => a + s.incidents.length, 0);
    const worst = perSite.flatMap(s => s.incidents).reduce<{ durationMin: number; siteName: string } | null>((acc, curr) => {
      if (!acc || curr.durationMin > acc.durationMin) return { durationMin: curr.durationMin, siteName: curr.siteName };
      return acc;
    }, null);
    const sslWarnings = perSite.filter(s => s.sslDaysUntilExpiry !== null && s.sslDaysUntilExpiry <= 30).length;
    const SLA_TARGET = 99.9;
    let aiHealthScore = Math.max(0, Math.min(100, overallUptimeAvg - Math.min(totalIncidents * 2, 20)));

    // Integrate AI diagnostics/predictions (optional)
    let aiAvailable = false;
    const aiBySite: Record<string, AIAnalysis> = {};
    try {
      const health = await kimiPredictiveService.getHealthStatus();
      aiAvailable = !!health.available;
    } catch {
      aiAvailable = false;
    }

    if (aiAvailable) {
      await Promise.all(perSite.map(async (s) => {
        try {
          const [analysis, prediction] = await Promise.all([
            kimiPredictiveService.analyzeSiteHealth(s.siteId),
            kimiPredictiveService.predictSiteStatus(s.siteId, '30d')
          ]);
          aiBySite[s.siteId] = {
            diagnosis: analysis.diagnosis,
            severity: analysis.severity,
            recommendations: analysis.recommendations,
            predictedStatus: prediction.predictedStatus,
            predictionConfidence: prediction.confidence,
            riskFactors: (prediction as any).riskFactors || [],
          };
        } catch (e) {
          // Ignore AI failure per site to avoid breaking the report
        }
      }));

      // Compute AI-derived health score from predictions if available
      let sum = 0;
      let weight = 0;
      perSite.forEach(s => {
        const ai = aiBySite[s.siteId];
        if (!ai || ai.predictedStatus === undefined || ai.predictionConfidence === undefined) return;
        const v = ai.predictedStatus === 'up' ? 95 : ai.predictedStatus === 'degraded' ? 70 : 30;
        const w = Math.max(0.1, Math.min(1, ai.predictionConfidence));
        sum += v * w;
        weight += w;
      });
      if (weight > 0) {
        aiHealthScore = Math.round(sum / weight);
      }
    }

    // Traffic light for SLA
    const slaIcon = overallUptimeAvg >= SLA_TARGET ? '🟢' : (overallUptimeAvg >= (SLA_TARGET - 1) ? '🟡' : '🔴');

    // Prepare incidents by site and sort by severity (HIGH > MEDIUM > LOW), then by duration desc
    const severityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const incidentsBySite = perSite.map(s => ({
      siteId: s.siteId,
      siteName: s.siteName,
      incidents: s.incidents.slice().sort((a, b) => {
        const sr = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        if (sr !== 0) return sr;
        return (b.durationMin || 0) - (a.durationMin || 0);
      })
    }));

    // Recurring root causes (by layer)
    const layerCounts: Record<string, number> = {};
    perSite.forEach(s => s.incidents.forEach(i => {
      layerCounts[i.layer] = (layerCounts[i.layer] || 0) + 1;
    }));
    const recurringRootCauses = Object.entries(layerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Preventive suggestions map (fallback if AI not available)
    const suggestionsByLayer: Record<string, string> = {
      HTTP: 'Review server health, optimize application performance, add autoscaling, monitor error rates',
      PING: 'Check network connectivity/firewall rules, ensure host availability, investigate packet loss',
      DNS: 'Validate DNS records and TTLs, ensure nameserver availability, consider provider redundancy',
      UNKNOWN: 'Investigate logs and monitoring data to identify the root cause'
    };

    // Sites predicted at risk (AI preferred; fallback heuristic)
    const atRisk = aiAvailable
      ? perSite
          .map(s => {
            const ai = aiBySite[s.siteId];
            if (!ai || !ai.predictedStatus || ai.predictedStatus === 'up') return null;
            const icon = ai.predictedStatus === 'down' ? '🔴' : '🟡';
            const risk = Math.round((ai.predictionConfidence || 0.8) * 100);
            return { siteName: s.siteName, label: `${icon} ${ai.predictedStatus}`, risk };
          })
          .filter((x): x is { siteName: string; label: string; risk: number } => !!x)
          .sort((a, b) => b.risk - a.risk)
          .slice(0, 5)
      : perSite
          .map(s => ({ siteName: s.siteName, risk: Math.min(100, Math.max(0, Math.round((100 - s.overallUptime) + s.incidents.length * 5))) }))
          .sort((a, b) => b.risk - a.risk)
          .filter(r => r.risk > 0)
          .slice(0, 3)
          .map(r => ({ siteName: r.siteName, label: 'heuristic', risk: r.risk }));

    // Generate HTML content
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Report ${period}</title>
      <style>
        body { 
          font-family: '${themeSettings.fontPrimary}', 'Segoe UI', Arial, sans-serif; 
          margin: 0; 
          padding: 30px; 
          color: ${themeSettings.textPrimary}; 
          background-color: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.secondaryColor}); 
          color: white; 
          padding: 40px; 
          text-align: center; 
        }
        .header .subtitle { font-size: 1.1em; opacity: 0.9; }
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
          gap: 16px; 
          margin: 20px 0; 
        }
        .card { 
          background: #fff; 
          border-radius: 10px; 
          border: 1px solid #eee; 
          padding: 16px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.06); 
        }
        .card h3 { margin: 0 0 8px 0; color: ${themeSettings.primaryColor}; font-size: 1.05em; }
        .value { font-size: 1.6em; font-weight: 700; }
        .section { 
          background: #fff; 
          padding: 24px; 
          margin-bottom: 24px; 
        }
        .section-title { 
          color: ${themeSettings.primaryColor}; 
          font-size: 1.4em; 
          margin: 0 0 12px 0; 
          border-bottom: 2px solid ${themeSettings.primaryColor}20; 
          padding-bottom: 8px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 12px; 
          background: white;
        }
        th { 
          background: ${themeSettings.primaryColor}; 
          color: #fff; 
          padding: 12px; 
          text-align: left; 
          font-size: 0.9em; 
        }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #f0f0f0; 
          font-size: 0.9em; 
        }
        tr:nth-child(even) td { background: #fafafa; }
        .status-up { color: ${themeSettings.successColor}; font-weight: 600; }
        .status-down { color: ${themeSettings.errorColor}; font-weight: 600; }
        .chip { 
          display: inline-block; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 0.8em; 
        }
        .chip-ok { background: #e8f5e9; color: ${themeSettings.successColor}; }
        .chip-warn { background: #fff8e1; color: ${themeSettings.warningColor}; }
        .chip-err { background: #ffebee; color: ${themeSettings.errorColor}; }
        .site-group { 
          background: #f3f6ff; 
          color: ${themeSettings.primaryColor}; 
          font-weight: 700; 
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: ${themeSettings.textSecondary}; 
          font-size: 0.9em; 
          padding: 20px;
          border-top: 1px solid #eee;
        }
        .ai-table {
          margin-top: 20px;
        }
        .ai-table th {
          background: ${themeSettings.infoColor};
        }
        .risk-list {
          margin-top: 12px;
        }
        .risk-list ul {
          margin: 6px 0 0 18px;
        }
        .risk-list li {
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
              `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${themeUser?.companyName || 'Company'} Logo" style="max-height: 50px; max-width: 180px; margin-right: 14px;">` :
              `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${themeUser?.companyName || 'Company'} Logo" style="max-height: 50px; max-width: 180px; margin-right: 14px;">`
            }
            <div>
              <h1 style="margin:0;">Monthly Report</h1>
              <div class="subtitle">${period} • Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div><strong>${themeUser?.companyName || ''}</strong></div>
        </div>

        <div class="section">
          <div class="section-title">Executive Snapshot</div>
          <div class="summary-grid">
            <div class="card">
              <h3>Overall Uptime vs SLA</h3>
              <div class="value">${slaIcon} ${overallUptimeAvg.toFixed(2)}% <span style="font-size:0.6em; color:#fff; background:${overallUptimeAvg >= SLA_TARGET ? themeSettings.successColor : themeSettings.errorColor}; padding:2px 6px; border-radius:10px;">SLA ${SLA_TARGET}%</span></div>
            </div>
            <div class="card">
              <h3>Total Incidents</h3>
              <div class="value">${totalIncidents}</div>
            </div>
            <div class="card">
              <h3>Worst Outage</h3>
              <div class="value">${worst ? `${worst.durationMin} min` : 'N/A'}</div>
              <div style="font-size:0.85em; color:${themeSettings.textSecondary}">${worst ? worst.siteName : ''}</div>
            </div>
            <div class="card">
              <h3>AI Health Score</h3>
              <div class="value">${Math.round(aiHealthScore)}</div>
            </div>
            <div class="card">
              <h3>SSL Expiry Warnings</h3>
              <div class="value">${sslWarnings}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Per-Site Uptime</div>
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Uptime %</th>
                <th>HTTP</th>
                <th>Ping</th>
                <th>DNS</th>
                <th>Avg latency</th>
                <th>Incidents</th>
                <th>SSL expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${perSite.map(s => `
                <tr>
                  <td>${s.siteName}</td>
                  <td>${s.overallUptime.toFixed(2)}%</td>
                  <td>${s.httpUptime.toFixed(2)}%</td>
                  <td>${s.pingUptime.toFixed(2)}%</td>
                  <td>${s.dnsUptime.toFixed(2)}%</td>
                  <td>${s.avgLatencyMs != null ? s.avgLatencyMs + 'ms' : '-'}</td>
                  <td><a href="#incidents-${s.siteId}">${s.incidents.length}</a></td>
                  <td>${s.sslDaysUntilExpiry != null ? `${s.sslDaysUntilExpiry} days` : '-'}</td>
                  <td>${s.lastIsUp == null ? '<span class="chip chip-warn">Unknown</span>' : s.lastIsUp ? '<span class="chip chip-ok">Online</span>' : '<span class="chip chip-err">Offline</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section" id="incidents">
          <div class="section-title">Incident Log</div>
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Layer</th>
                <th>AI Root Cause</th>
                <th>Suggested Fix</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              ${incidentsBySite.map(group => `
                <tr class="site-group" id="incidents-${group.siteId}"><td colspan="9">${group.siteName}</td></tr>
                ${group.incidents.map(i => {
                  const ai = aiBySite[group.siteId] || {};
                  const cause = ai.diagnosis ? (ai.diagnosis.length > 140 ? ai.diagnosis.slice(0, 140) + '…' : ai.diagnosis) : '-';
                  const fix = (ai.recommendations && ai.recommendations.length > 0) ? ai.recommendations[0] : (suggestionsByLayer[i.layer] || suggestionsByLayer.UNKNOWN);
                  return `
                  <tr>
                    <td>${group.siteName}</td>
                    <td>${new Date(i.start).toLocaleString()}</td>
                    <td>${i.end ? new Date(i.end).toLocaleString() : '-'}</td>
                    <td>${i.durationMin} min</td>
                    <td>${i.layer}</td>
                    <td>${cause}</td>
                    <td>${fix}</td>
                    <td>${i.end ? 'Resolved' : 'Ongoing'}</td>
                    <td>-</td>
                  </tr>`;
                }).join('')}
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">AI Insights & Recommendations</div>
          ${aiAvailable ? `
          <table class="ai-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Diagnosis</th>
                <th>Top Recommendations</th>
              </tr>
            </thead>
            <tbody>
              ${perSite.map(s => {
                  const ai = aiBySite[s.siteId];
                  if (!ai) return `
                    <tr>
                      <td>${s.siteName}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>AI unavailable</td>
                      <td>—</td>
                    </tr>`;
                  const icon = ai.predictedStatus === 'down' ? '🔴' : ai.predictedStatus === 'degraded' ? '🟡' : '🟢';
                  const diag = ai.diagnosis ? (ai.diagnosis.length > 160 ? ai.diagnosis.slice(0, 160) + '…' : ai.diagnosis) : '—';
                  const recs = (ai.recommendations || []).slice(0, 3).map(r => `<div>• ${r}</div>`).join('') || '—';
                  const conf = ai.predictionConfidence != null ? Math.round(ai.predictionConfidence * 100) + '%' : '—';
                  return `
                    <tr>
                      <td>${s.siteName}</td>
                      <td>${icon} ${ai.predictedStatus || '—'}</td>
                      <td>${conf}</td>
                      <td>${diag}</td>
                      <td>${recs}</td>
                    </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="risk-list">
            <strong>Sites predicted "at risk":</strong>
            <ul>
              ${atRisk.length > 0 ? atRisk.map(r => `<li>${r.siteName}: ${r.label} • ${r.risk}%</li>`).join('') : '<li>None</li>'}
            </ul>
          </div>
          ` : `
          <div style="color:${themeSettings.textSecondary}">AI diagnostics are not configured. This section will display root causes, preventive actions, and predicted risks when enabled.</div>
          `}
        </div>

        <div class="section">
          <div class="section-title">SLA & Compliance</div>
          <div>Target SLA: ${SLA_TARGET}% • Actual: ${overallUptimeAvg.toFixed(2)}%</div>
          <div style="margin-top:8px;color:${themeSettings.textSecondary}">Potential credits/impact: —</div>
        </div>

        <div class="section">
          <div class="section-title">Appendix</div>
          <ul style="margin:0 0 0 18px;">
            <li>Methodology: checks aggregated between ${startDate.toDateString()} and ${endDate.toDateString()}.</li>
            <li>Intervals: as configured per site.</li>
            <li>IPs to whitelist: —</li>
            <li>AI diagnostic notes: —</li>
          </ul>
        </div>

        <div class="footer">
          <div style="border-top:2px solid ${themeSettings.primaryColor}; padding-top: 16px;">
            ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
              `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${themeUser?.companyName || 'Company'} Logo" style="max-height: 28px; max-width: 100px; margin-right: 8px;">` :
              `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${themeUser?.companyName || 'Company'} Logo" style="max-height: 28px; max-width: 100px; margin-right: 8px;">`
            }
            <div><strong>${themeUser?.companyName || ''}</strong> • Monthly Report • ${period}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Generate incidents from status changes
   */
  private generateIncidents(statuses: SiteStatus[]): Array<{ startTime: Date; endTime: Date | null; durationMin: number; layer: string; severity: string; }> {
    const incidents: Array<{ startTime: Date; endTime: Date | null; durationMin: number; layer: string; severity: string; }> = [];
    let current: { startTime: Date; failed: SiteStatus[] } | null = null;
    
    for (const s of statuses) {
      if (!s.isUp) {
        if (!current) current = { startTime: s.checkedAt, failed: [s] };
        else current.failed.push(s);
      } else if (current) {
        const endTime = s.checkedAt;
        const durationMin = Math.max(1, Math.round((endTime.getTime() - current.startTime.getTime()) / 60000));
        const layer = current.failed.some(f => !f.httpIsUp) ? 'HTTP' : current.failed.some(f => !f.pingIsUp) ? 'PING' : current.failed.some(f => !f.dnsIsUp) ? 'DNS' : 'UNKNOWN';
        const severity = durationMin > 60 ? 'HIGH' : durationMin > 15 ? 'MEDIUM' : 'LOW';
        incidents.push({ startTime: current.startTime, endTime, durationMin, layer, severity });
        current = null;
      }
    }
    
    if (current) {
      const endTime = null;
      const durationMin = Math.max(1, Math.round((Date.now() - current.startTime.getTime()) / 60000));
      const layer = current.failed.some(f => !f.httpIsUp) ? 'HTTP' : current.failed.some(f => !f.pingIsUp) ? 'PING' : current.failed.some(f => !f.dnsIsUp) ? 'DNS' : 'UNKNOWN';
      const severity = durationMin > 60 ? 'HIGH' : durationMin > 15 ? 'MEDIUM' : 'LOW';
      incidents.push({ startTime: current.startTime, endTime, durationMin, layer, severity });
    }
    
    return incidents;
  }
}

export const monthlyReportService = new MonthlyReportService();
export async function generateMonthlyReportHTML(date: string, userId: string): Promise<string> {
  return monthlyReportService.generateMonthlyReportHTML({ userId, period: date });
} 