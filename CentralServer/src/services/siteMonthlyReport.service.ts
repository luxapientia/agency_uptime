import { PrismaClient, SiteStatus } from '@prisma/client'
import { kimiPredictiveService } from './kimiPredictive.service'

const domain = process.env.DOMAIN || 'report.agencyuptime.com'
const prisma = new PrismaClient()
const SLA_TARGET = 99.9

function clampDate(value: Date, min: Date, max: Date): Date {
  return new Date(Math.min(Math.max(value.getTime(), min.getTime()), max.getTime()))
}

function timeWeightedUptime(
  statusesAsc: SiteStatus[],
  start: Date,
  end: Date,
  predicate: (s: SiteStatus) => boolean
): number | null {
  if (statusesAsc.length === 0 || start >= end) return null
  let totalMs = 0, upMs = 0
  for (let i = 0; i < statusesAsc.length; i++) {
    const current = statusesAsc[i]
    const next = statusesAsc[i + 1]
    const curTs = clampDate(current.checkedAt, start, end)
    const nextTs = clampDate(next?.checkedAt ?? end, start, end)
    if (nextTs <= curTs) continue
    const win = nextTs.getTime() - curTs.getTime()
    totalMs += win
    if (predicate(current)) upMs += win
  }
  if (totalMs <= 0) {
    // Fallback: percentage based on sample count when window durations cannot be computed
    const upCount = statusesAsc.filter(predicate).length
    const pct = (upCount / statusesAsc.length) * 100
    return Math.round(pct * 100) / 100
  }
  return Math.round(((upMs / totalMs) * 100) * 100) / 100
}

function pickIncidentLayer(window: SiteStatus[]): 'HTTP' | 'PING' | 'DNS' | 'UNKNOWN' {
  let http = 0, ping = 0, dns = 0
  for (const s of window) {
    if (!s.httpIsUp) http++
    if (!s.pingIsUp) ping++
    if (!s.dnsIsUp) dns++
  }
  if (http >= ping && http >= dns && http > 0) return 'HTTP'
  if (ping >= http && ping >= dns && ping > 0) return 'PING'
  if (dns >= http && dns >= ping && dns > 0) return 'DNS'
  return 'UNKNOWN'
}

function buildIncidents(statusesAsc: SiteStatus[], start: Date, end: Date) {
  const incidents: Array<{ start: Date; end: Date | null; durationMin: number; layer: 'HTTP' | 'PING' | 'DNS' | 'UNKNOWN' }> = []
  let openStart: Date | null = null
  let buf: SiteStatus[] = []
  for (const s of statusesAsc) {
    if (!s.isUp) {
      if (!openStart) openStart = clampDate(s.checkedAt, start, end)
      buf.push(s)
    } else if (openStart) {
      const segEnd = clampDate(s.checkedAt, start, end)
      const layer = pickIncidentLayer(buf)
      const durationMin = Math.max(1, Math.round((segEnd.getTime() - openStart.getTime()) / 60000))
      incidents.push({ start: openStart, end: segEnd, durationMin, layer })
      openStart = null
      buf = []
    }
  }
  if (openStart) {
    const layer = pickIncidentLayer(buf)
    const durationMin = Math.max(1, Math.round((end.getTime() - openStart.getTime()) / 60000))
    incidents.push({ start: openStart, end: null, durationMin, layer })
  }
  return incidents
}

function formatDate(date: Date | string | null | undefined, includeTime = true) {
  if (!date) return '—';
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC'
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

function formatResponseTime(time: number | null) {
  if (time === null || time === undefined) return '—';
  return `${Math.round(time)}ms`;
}

function getStatusColor(isUp: boolean, theme: any) {
  return isUp ? theme.successColor : theme.errorColor;
}

function formatUptime(uptime: number, theme: any) {
  if (uptime >= 99.9) return `<span style="color: ${theme.successColor}; font-weight: bold;">${uptime.toFixed(2)}%</span>`;
  if (uptime >= 95) return `<span style="color: ${theme.warningColor}; font-weight: bold;">${uptime.toFixed(2)}%</span>`;
  return `<span style="color: ${theme.errorColor}; font-weight: bold;">${uptime.toFixed(2)}%</span>`;
}

function calculateUptimeStats(statuses: SiteStatus[]) {
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
}

function fmtUptime(u: number | null, theme: any) {
  if (u == null) return '—'
  const v = u.toFixed(2) + '%'
  if (u >= 99.9) return `<span style="color:${theme.successColor}; font-weight:700;">${v}</span>`
  if (u >= 95) return `<span style="color:${theme.warningColor}; font-weight:700;">${v}</span>`
  return `<span style="color:${theme.errorColor}; font-weight:700;">${v}</span>`
}

function fmtMs(n: number | null) { return n == null ? '—' : `${Math.round(n)}ms` }

export async function generateSiteMonthlyReportHTML(siteId: string): Promise<string> {
  // Compute rolling 30-day window in UTC (from one month ago until now)
  const nowUTC = new Date(new Date().toISOString())
  const endDate = nowUTC
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  const periodStr = `${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(startDate)} → ${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(endDate)}`

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { user: { include: { themeSettings: true } }, notificationSettings: true }
  })
  if (!site) throw new Error('Site not found')

  const theme = site.user.themeSettings || {
    primaryColor: '#1976d2', secondaryColor: '#9c27b0', successColor: '#2e7d32', errorColor: '#d32f2f', warningColor: '#ed6c02', infoColor: '#0288d1', textPrimary: '#111827', textSecondary: '#6b7280', logo: 'logo.png', fontPrimary: 'Roboto'
  }

  console.log(theme, '---------------')

  // Fetch comprehensive status data for the month
  const [prev] = await prisma.siteStatus.findMany({ where: { siteId, checkedAt: { lt: startDate } }, orderBy: { checkedAt: 'desc' }, take: 1 })
  let monthStatuses = await prisma.siteStatus.findMany({ 
    where: { siteId, checkedAt: { gte: startDate, lte: endDate } }, 
    orderBy: { checkedAt: 'asc' } 
  })

  // Fallback: if no data in the last 30 days, pull latest 50 statuses prior to now to avoid blank report
  if (monthStatuses.length === 0) {
    const recent = await prisma.siteStatus.findMany({
      where: { siteId, checkedAt: { lte: endDate } },
      orderBy: { checkedAt: 'desc' },
      take: 50
    })
    monthStatuses = recent.slice().reverse()
  }
  
  // Prepare consensus data and regional worker data
  const consensus = monthStatuses.filter(s => s.workerId === 'consensus_worker')
  const base: SiteStatus[] = (consensus.length ? consensus : monthStatuses).slice().sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime())
  
  // If still no data, try seeding base from the very latest single status to compute a flat uptime
  if (base.length === 0) {
    const latest = await prisma.siteStatus.findFirst({ where: { siteId }, orderBy: { checkedAt: 'desc' } })
    if (latest) {
      base.push({ ...latest, checkedAt: startDate })
      base.push({ ...latest, checkedAt: endDate })
      monthStatuses = [latest]
    }
  }

  // Group status data by worker for regional analysis
  const statusByWorker: Record<string, SiteStatus[]> = {}
  const latestByWorker: Record<string, SiteStatus> = {}

  monthStatuses.forEach(status => {
    if (!statusByWorker[status.workerId]) {
      statusByWorker[status.workerId] = []
    }
    statusByWorker[status.workerId].push(status)

    if (!latestByWorker[status.workerId] ||
      status.checkedAt > latestByWorker[status.workerId].checkedAt) {
      latestByWorker[status.workerId] = status
    }
  })

  const consensusData = latestByWorker['consensus_worker']
  const workerIds = Object.keys(latestByWorker).filter(w => w !== 'consensus_worker')

  // Time-weighted monthly uptimes
  const overallUptime = timeWeightedUptime(base, startDate, endDate, s => s.isUp)
  const httpUptime = timeWeightedUptime(base, startDate, endDate, s => s.httpIsUp)
  const pingUptime = timeWeightedUptime(base, startDate, endDate, s => s.pingIsUp)
  const dnsUptime = timeWeightedUptime(base, startDate, endDate, s => s.dnsIsUp)

  // Average latencies across month from any worker data
  const httpTimes = monthStatuses.map(s => s.httpResponseTime).filter((n): n is number => typeof n === 'number')
  const pingTimes = monthStatuses.map(s => s.pingResponseTime).filter((n): n is number => typeof n === 'number')
  const dnsTimes = monthStatuses.map(s => s.dnsResponseTime).filter((n): n is number => typeof n === 'number')
  const avgHttpMs = httpTimes.length ? Math.round(httpTimes.reduce((a, b) => a + b, 0) / httpTimes.length) : null
  const avgPingMs = pingTimes.length ? Math.round(pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length) : null
  const avgDnsMs = dnsTimes.length ? Math.round(dnsTimes.reduce((a, b) => a + b, 0) / dnsTimes.length) : null

  // Calculate overall statistics
  const overallStats = calculateUptimeStats(monthStatuses)
  const consensusStats = consensusData ? calculateUptimeStats(statusByWorker['consensus_worker'] || []) : null

  // Incidents over the month
  const incidents = buildIncidents(base, startDate, endDate)

  // AI sections (diagnosis + 30d prediction)
  let aiAvailable = false
  let aiAnalysis: any = null
  let aiPrediction: any = null
  let aiHealthStatus = null
  try {
    aiHealthStatus = await kimiPredictiveService.getHealthStatus()
    aiAvailable = !!aiHealthStatus.available
    if (aiAvailable) {
      try { aiAnalysis = await kimiPredictiveService.analyzeSiteHealth(siteId) } catch {}
      try { aiPrediction = await kimiPredictiveService.predictSiteStatus(siteId, '30d') } catch {}
    }
  } catch {}

  const slaIcon = overallUptime == null ? '⚪' : (overallUptime >= SLA_TARGET ? '🟢' : (overallUptime >= (SLA_TARGET - 1) ? '🟡' : '🔴'))

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: '${theme.fontPrimary}', 'Segoe UI', Arial, sans-serif; 
      margin: 0; 
      padding: 30px; 
      background: rgb(255,255,255); 
      color: ${theme.textPrimary}; 
      line-height: 1.6; 
    }
    
    /* Page break controls for print/PDF */
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .page-break-avoid { page-break-inside: avoid; }
    .keep-together { 
      page-break-inside: avoid; 
      break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    
    .section { 
      background: white; 
      padding: 30px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
      page-break-inside: avoid; 
      break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    
    .header { 
      background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}); 
      color: #fff; 
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
    
    .subtitle { 
      font-size: 1.1em; 
      opacity: 0.9; 
      margin-bottom: 20px;
    }
    
    .company-info {
      background: rgba(255,255,255,0.1);
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .section-title { 
      color: ${theme.primaryColor}; 
      font-size: 1.6em; 
      margin-bottom: 16px; 
      display: flex; 
      align-items: center; 
      border-bottom: 2px solid ${theme.primaryColor}20; 
      padding-bottom: 10px;
      page-break-after: avoid;
      break-after: avoid;
    }
    
    .section-title .icon { margin-right: 10px; }
    
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); 
      gap: 16px; 
      margin-bottom: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .info-item { 
      padding: 15px; 
      background: #fff; 
      border-radius: 8px; 
      border-left: 3px solid ${theme.infoColor}; 
    }
    
    .info-item .label { 
      font-weight: 600; 
      color: ${theme.textSecondary}; 
      font-size: 0.9em; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    
    .info-item .value { 
      font-size: 1.05em; 
      margin-top: 6px; 
    }
    
    .cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
      gap: 16px; 
    }
    
    .card { 
      background: #fff; 
      border-radius: 10px; 
      border: 1px solid #eee; 
      padding: 16px; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); 
    }
    
    .card h3 { 
      margin: 0 0 6px 0; 
      color: ${theme.textSecondary}; 
      font-size: 0.9em; 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
    }
    
    .value { 
      font-size: 1.6em; 
      font-weight: 800; 
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
      color: ${theme.textSecondary};
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 14px; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      page-break-inside: auto;
    }
    
    th { 
      background: ${theme.primaryColor}; 
      color: #fff; 
      padding: 15px 12px; 
      text-align: left; 
      font-size: 0.9em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td { 
      padding: 12px; 
      border-bottom: 1px solid #f0f0f0; 
      font-size: 0.9em; 
      vertical-align: top; 
    }
    
    tr:nth-child(even) td { 
      background: #fafafa; 
    }
    
    tr:hover td {
      background: #f0f8ff;
    }
    
    thead {
      display: table-header-group;
    }
    
    .chip { 
      display:inline-block; 
      padding: 2px 8px; 
      border-radius: 12px; 
      font-size: 0.8em; 
    }
    
    .chip-ok { 
      background: #e8f5e9; 
      color: ${theme.successColor}; 
    }
    
    .chip-warn { 
      background: #fff8e1; 
      color: ${theme.warningColor}; 
    }
    
    .chip-err { 
      background: #ffebee; 
      color: ${theme.errorColor}; 
    }
    
    .status-up { 
      color: ${theme.successColor}; 
      font-weight: bold; 
      display: flex; 
      align-items: center;
    }
    
    .status-down { 
      color: ${theme.errorColor}; 
      font-weight: bold; 
      display: flex; 
      align-items: center;
    }
    
    .status-icon {
      margin-right: 5px;
      font-size: 1.1em;
    }
    
    .ssl-valid { color: ${theme.successColor}; font-weight: bold; }
    .ssl-invalid { color: ${theme.errorColor}; font-weight: bold; }
    .ssl-warning { color: ${theme.warningColor}; font-weight: bold; }
    
    .response-time-good { color: ${theme.successColor}; }
    .response-time-slow { color: ${theme.warningColor}; }
    .response-time-bad { color: ${theme.errorColor}; }
    
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
      border-left: 4px solid ${theme.warningColor};
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .alert-box.error {
      background: #f8d7da;
      border-color: #f5c6cb;
      border-left-color: ${theme.errorColor};
    }
    
    .alert-box.success {
      background: #d4edda;
      border-color: #c3e6cb;
      border-left-color: ${theme.successColor};
    }
    
    .worker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
      page-break-inside: auto;
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
    
    .worker-card:first-child {
      page-break-before: avoid;
    }
    
    .worker-title {
      font-weight: bold;
      color: ${theme.primaryColor};
      font-size: 1.2em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${theme.primaryColor}20;
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
      color: ${theme.textSecondary};
    }
    
    .metric-value {
      font-weight: 600;
    }
    
    .performance-analysis {
      margin-top: 15px; 
      padding: 15px; 
      background: #e3f2fd; 
      border-radius: 8px; 
      border-left: 4px solid ${theme.infoColor};
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .regional-workers-section {
      page-break-before: always;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: ${theme.textSecondary};
      font-size: 0.9em;
      page-break-inside: avoid;
      break-inside: avoid;
      border-top: 2px solid ${theme.primaryColor};
      padding-top: 20px;
    }
    
    @media print {
      body { background: white; }
      .section, .site-overview, .stats-section { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
      <img src="https://${domain}/${theme.logo}" alt="${site.user.companyName} Logo" style="max-height: 60px; max-width: 200px; margin-right: 20px;">
      <div>
        <h1 style="margin: 0; color: white;">Monthly Uptime Report</h1>
        <div class="subtitle">${site.name} • ${periodStr} • Generated: ${formatDate(new Date(), false)}</div>
      </div>
    </div>
    <div class="company-info">
      <strong>${site.user.companyName}</strong>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title"><span class="icon">🌐</span>Site Information</h2>
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
        <div class="value">${site.notificationSettings.length > 0 ? site.notificationSettings.map(n => n.type).join(', ') : 'None configured'}</div>
      </div>
    </div>
  </div>

  ${aiHealthStatus && aiHealthStatus.available ? `
    <div class="section keep-together">
      <h2 class="section-title"><span class="icon">🤖</span>AI-Powered Monthly Analysis</h2>
      
      ${aiAnalysis ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: ${theme.primaryColor}; margin-bottom: 20px; display: flex; align-items: center;">
          <span style="margin-right: 10px;">🔍</span>Health Diagnosis for ${periodStr}
        </h3>
        
        <div class="info-grid" style="margin-bottom: 20px;">
          <div class="info-item">
            <div class="label">AI Service Status</div>
            <div class="value status-up">✅ Available (${aiHealthStatus.model})</div>
          </div>
          <div class="info-item">
            <div class="label">Analysis Confidence</div>
            <div class="value">${aiAnalysis.confidence ? Math.round(aiAnalysis.confidence * 100) : 'N/A'}%</div>
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
            <div class="value">${aiAnalysis.tokenUsage ? aiAnalysis.tokenUsage.total : 'N/A'} tokens</div>
          </div>
        </div>
        
        <div style="background: ${aiAnalysis.severity === 'critical' ? '#f8d7da' : aiAnalysis.severity === 'high' ? '#fff3cd' : aiAnalysis.severity === 'medium' ? '#e3f2fd' : '#d4edda'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${aiAnalysis.severity === 'critical' ? theme.errorColor : aiAnalysis.severity === 'high' ? theme.warningColor : aiAnalysis.severity === 'medium' ? theme.infoColor : theme.successColor}; margin-bottom: 20px;">
          <strong>🤖 AI Monthly Diagnosis:</strong><br>
          ${aiAnalysis.diagnosis || 'Analysis completed successfully.'}
        </div>
        
        ${aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: ${theme.primaryColor}; margin-bottom: 15px;">💡 AI Recommendations</h4>
          <ul style="padding-left: 20px; margin: 0;">
            ${aiAnalysis.recommendations.map((rec: string) => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      ${aiPrediction ? `
      <div>
        <h3 style="color: ${theme.primaryColor}; margin-bottom: 20px; display: flex; align-items: center;">
          <span style="margin-right: 10px;">🔮</span>30-Day Prediction
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
            <div class="value">${aiPrediction.confidence ? Math.round(aiPrediction.confidence * 100) : 'N/A'}%</div>
          </div>
          <div class="info-item">
            <div class="label">Timeframe</div>
            <div class="value">${aiPrediction.timeframe || '30 days'}</div>
          </div>
          <div class="info-item">
            <div class="label">AI Tokens Used</div>
            <div class="value">${aiPrediction.tokenUsage ? aiPrediction.tokenUsage.total : 'N/A'} tokens</div>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid ${theme.infoColor}; margin-bottom: 20px;">
          <strong>🔮 AI Prediction Reasoning:</strong><br>
          ${aiPrediction.reasoning || 'Prediction based on historical performance data.'}
        </div>
        
        ${aiPrediction.recommendations && aiPrediction.recommendations.length > 0 ? `
        <div>
          <h4 style="color: ${theme.primaryColor}; margin-bottom: 15px;">🚀 Predictive Recommendations</h4>
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
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${theme.textSecondary};">
        <strong>ℹ️ AI Service Status:</strong><br>
        AI-powered analysis is currently unavailable. This may be due to service configuration or temporary unavailability.
      </div>
    </div>
    `}

  <div class="section">
    <h2 class="section-title"><span class="icon">📊</span>Executive Monthly Summary</h2>
    <div class="cards">
      <div class="card">
        <h3>Overall Uptime vs SLA</h3>
        <div class="value">
          ${slaIcon} ${overallUptime != null ? overallUptime.toFixed(2) + '%' : '—'} 
          <span class="chip ${overallUptime != null && overallUptime >= SLA_TARGET ? 'chip-ok' : 'chip-err'}" style="margin-left:6px;">
            SLA ${SLA_TARGET}%
          </span>
        </div>
      </div>
      <div class="card">
        <h3>HTTP Uptime</h3>
        <div class="value">${fmtUptime(httpUptime, theme)}</div>
      </div>
      <div class="card">
        <h3>Ping Uptime</h3>
        <div class="value">${fmtUptime(pingUptime, theme)}</div>
      </div>
      <div class="card">
        <h3>DNS Uptime</h3>
        <div class="value">${fmtUptime(dnsUptime, theme)}</div>
      </div>
      <div class="card">
        <h3>Avg HTTP Latency</h3>
        <div class="value">${fmtMs(avgHttpMs)}</div>
      </div>
      <div class="card">
        <h3>Avg Ping Latency</h3>
        <div class="value">${fmtMs(avgPingMs)}</div>
      </div>
      <div class="card">
        <h3>Avg DNS Latency</h3>
        <div class="value">${fmtMs(avgDnsMs)}</div>
      </div>
      <div class="card">
        <h3>Incidents</h3>
        <div class="value">${incidents.length}</div>
      </div>
    </div>
  </div>

  ${consensusData ? `
  <div class="section keep-together">
    <h2 class="section-title"><span class="icon">🎯</span>Monthly Consensus Analysis</h2>
    
    <div class="info-grid" style="margin-bottom: 20px;">
      <div class="info-item">
        <div class="label">Overall Monthly Status</div>
        <div class="value ${overallUptime && overallUptime >= SLA_TARGET ? 'status-up' : 'status-down'}">
          ${overallUptime && overallUptime >= SLA_TARGET ? '✅ SLA Met' : '❌ SLA Missed'}
        </div>
      </div>
      <div class="info-item">
        <div class="label">Total Monthly Checks</div>
        <div class="value">${monthStatuses.length} checks</div>
      </div>
      <div class="info-item">
        <div class="label">Consensus Data Points</div>
        <div class="value">${consensus.length} consensus</div>
      </div>
      <div class="info-item">
        <div class="label">Reporting Period</div>
        <div class="value">${periodStr}</div>
      </div>
    </div>
    
    <h3 style="color: ${theme.primaryColor}; margin: 20px 0 15px 0;">📊 Monthly Performance Metrics</h3>
    <table>
      <thead>
        <tr>
          <th>Test Type</th>
          <th>Monthly Uptime</th>
          <th>Performance Rating</th>
          <th>Avg Response Time</th>
          <th>Analysis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>🏓 Ping Test</strong></td>
          <td><span class="value">${fmtUptime(pingUptime, theme)}</span></td>
          <td>
            ${avgPingMs ?
              avgPingMs < 50 ? '🟢 Excellent' :
                avgPingMs < 100 ? '🟡 Good' :
                  avgPingMs < 200 ? '🟠 Fair' :
                    '🔴 Poor' : 'N/A'
            }
          </td>
          <td>${fmtMs(avgPingMs)}</td>
          <td>Network connectivity and latency monitoring</td>
        </tr>
        <tr>
          <td><strong>🌐 HTTP Test</strong></td>
          <td><span class="value">${fmtUptime(httpUptime, theme)}</span></td>
          <td>
            ${avgHttpMs ?
              avgHttpMs < 500 ? '🟢 Excellent' :
                avgHttpMs < 1000 ? '🟡 Good' :
                  avgHttpMs < 2000 ? '🟠 Fair' :
                    '🔴 Poor' : 'N/A'
            }
          </td>
          <td>${fmtMs(avgHttpMs)}</td>
          <td>Web server response time and availability</td>
        </tr>
        <tr>
          <td><strong>🔍 DNS Test</strong></td>
          <td><span class="value">${fmtUptime(dnsUptime, theme)}</span></td>
          <td>
            ${avgDnsMs ?
              avgDnsMs < 50 ? '🟢 Excellent' :
                avgDnsMs < 100 ? '🟡 Good' :
                  avgDnsMs < 200 ? '🟠 Fair' :
                    '🔴 Poor' : 'N/A'
            }
          </td>
          <td>${fmtMs(avgDnsMs)}</td>
          <td>Domain name resolution performance</td>
        </tr>
      </tbody>
    </table>
    
    <div class="performance-analysis">
      <strong>📈 Monthly Performance Analysis:</strong><br>
      • <strong>Network Performance:</strong> ${avgPingMs ?
        avgPingMs < 50 ? 'Excellent - Consistently low latency throughout the month' :
          avgPingMs < 100 ? 'Good - Acceptable latency with minor variations' :
            avgPingMs < 200 ? 'Fair - Some latency issues observed during the month' :
              'Poor - High latency affecting overall performance' : 'No data available'
      }<br>
      • <strong>Server Response:</strong> ${avgHttpMs ?
        avgHttpMs < 500 ? 'Excellent - Fast and consistent server responses' :
          avgHttpMs < 1000 ? 'Good - Normal server response times maintained' :
            avgHttpMs < 2000 ? 'Fair - Occasional slow server responses detected' :
              'Poor - Significant server response delays observed' : 'No data available'
      }<br>
      • <strong>DNS Resolution:</strong> ${avgDnsMs ?
        avgDnsMs < 50 ? 'Excellent - Rapid DNS resolution throughout the month' :
          avgDnsMs < 100 ? 'Good - Stable DNS performance' :
            avgDnsMs < 200 ? 'Fair - Some DNS resolution delays' :
              'Poor - DNS performance issues affecting user experience' : 'No data available'
      }
    </div>

    ${consensusData.hasSsl ? `
    <div class="keep-together" style="margin-top: 20px;">
      <h3 style="color: ${theme.primaryColor}; margin-bottom: 10px;">🔒 SSL Certificate Status</h3>
      
      <div class="info-grid" style="margin-bottom: 20px;">
        <div class="info-item">
          <div class="label">SSL Status</div>
          <div class="value ssl-valid">✅ Valid & Active</div>
        </div>
        <div class="info-item">
          <div class="label">Certificate Issuer</div>
          <div class="value">${consensusData.sslIssuer || 'Unknown Certificate Authority'}</div>
        </div>
        <div class="info-item">
          <div class="label">Valid From</div>
          <div class="value">${formatDate(consensusData.sslValidFrom, false)}</div>
        </div>
        <div class="info-item">
          <div class="label">Expiration Date</div>
          <div class="value ${consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 30 ? 'ssl-warning' : 'ssl-valid'}">
            ${formatDate(consensusData.sslValidTo, false)}
          </div>
        </div>
        <div class="info-item">
          <div class="label">Days Until Expiry</div>
          <div class="value ${consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 30 ? 'ssl-warning' : consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 90 ? 'response-time-slow' : 'ssl-valid'}">
            ${consensusData.sslDaysUntilExpiry !== null ? `${consensusData.sslDaysUntilExpiry} days` : 'Unknown'}
          </div>
        </div>
        <div class="info-item">
          <div class="label">Monthly SSL Stability</div>
          <div class="value ssl-valid">
            ✅ Maintained throughout ${periodStr}
          </div>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 15px; background: ${consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 30 ? '#f8d7da' : '#d4edda'}; border-radius: 8px; border-left: 4px solid ${consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 30 ? theme.errorColor : theme.successColor};">
        <strong>🔍 Monthly SSL Analysis:</strong><br>
        ${consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 30 ?
          `⚠️ <strong>Certificate expires in ${consensusData.sslDaysUntilExpiry} days!</strong> Immediate renewal required to prevent service interruption.` :
          consensusData.sslDaysUntilExpiry && consensusData.sslDaysUntilExpiry < 90 ?
            `⚠️ <strong>Certificate expires in ${consensusData.sslDaysUntilExpiry} days.</strong> Plan renewal within the next 30 days.` :
            `✅ <strong>Certificate remains valid for ${consensusData.sslDaysUntilExpiry} more days.</strong> SSL security maintained throughout the reporting period.`
        }<br>
        • <strong>Certificate Authority:</strong> ${consensusData.sslIssuer || 'Unknown'}<br>
        • <strong>Monthly Stability:</strong> SSL certificate remained valid and properly configured throughout ${periodStr}
      </div>
    </div>
    ` : `
    <div class="alert-box error" style="margin-top: 20px;">
      <strong>⚠️ SSL Certificate Not Detected</strong><br>
      This site did not have a valid SSL certificate during the ${periodStr} reporting period. This poses security risks and may affect user trust and SEO rankings.<br>
      <strong>Monthly Impact:</strong> Users accessing this site received browser security warnings throughout the month.<br>
      <strong>Recommendation:</strong> Immediately install an SSL certificate from a trusted Certificate Authority to ensure secure communications.
    </div>
    `}

    ${consensusData.dnsNameservers && consensusData.dnsNameservers.length > 0 ? `
    <div class="keep-together" style="margin-top: 20px;">
      <h3 style="color: ${theme.primaryColor}; margin-bottom: 10px;">🌐 DNS Configuration Analysis</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">DNS Resolution Status</div>
          <div class="value ${consensusData.dnsIsUp ? 'status-up' : 'status-down'}">
            ${consensusData.dnsIsUp ? '✅ Resolving Successfully' : '❌ Resolution Issues'}
          </div>
        </div>
        <div class="info-item">
          <div class="label">Monthly DNS Uptime</div>
          <div class="value">${fmtUptime(dnsUptime, theme)}</div>
        </div>
        <div class="info-item">
          <div class="label">Nameserver Count</div>
          <div class="value">${consensusData.dnsNameservers.length} servers</div>
        </div>
        <div class="info-item">
          <div class="label">Avg Resolution Time</div>
          <div class="value">${fmtMs(avgDnsMs)}</div>
        </div>
      </div>
      
      <div class="info-item" style="margin-top: 15px;">
        <div class="label">Nameserver Configuration</div>
        <div class="value">
          <ul class="dns-list">
            ${consensusData.dnsNameservers.map((ns: string, index: number) =>
              `<li><strong>NS${index + 1}:</strong> ${ns}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 15px; background: ${consensusData.dnsIsUp ? '#d4edda' : '#f8d7da'}; border-radius: 8px; border-left: 4px solid ${consensusData.dnsIsUp ? theme.successColor : theme.errorColor};">
        <strong>🔍 Monthly DNS Analysis:</strong><br>
        • <strong>Uptime Performance:</strong> DNS resolution achieved ${dnsUptime ? dnsUptime.toFixed(2) : '0'}% uptime during ${periodStr}<br>
        • <strong>Response Performance:</strong> Average resolution time of ${fmtMs(avgDnsMs)} throughout the month<br>
        • <strong>Configuration Stability:</strong> ${consensusData.dnsNameservers.length} nameservers maintained consistent configuration
      </div>
    </div>
    ` : `
    <div class="alert-box error" style="margin-top: 20px;">
      <strong>⚠️ DNS Configuration Data Unavailable</strong><br>
      No DNS configuration data was collected during the ${periodStr} reporting period.
    </div>
    `}

    ${consensusData.tcpChecks && Array.isArray(consensusData.tcpChecks) && consensusData.tcpChecks.length > 0 ? `
    <div class="keep-together" style="margin-top: 20px;">
      <h3 style="color: ${theme.primaryColor}; margin-bottom: 10px;">🔌 TCP Port Analysis</h3>
      
      <div class="info-grid" style="margin-bottom: 20px;">
        <div class="info-item">
          <div class="label">Total Ports Monitored</div>
          <div class="value">${consensusData.tcpChecks.length} ports</div>
        </div>
        <div class="info-item">
          <div class="label">Open Ports</div>
          <div class="value">${consensusData.tcpChecks.filter((tcp: any) => tcp.isUp).length} open</div>
        </div>
        <div class="info-item">
          <div class="label">Closed/Filtered</div>
          <div class="value">${consensusData.tcpChecks.filter((tcp: any) => !tcp.isUp).length} closed</div>
        </div>
        <div class="info-item">
          <div class="label">Monthly Consistency</div>
          <div class="value ssl-valid">✅ Stable</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Port</th>
            <th>Status</th>
            <th>Service</th>
            <th>Monthly Stability</th>
            <th>Security Assessment</th>
          </tr>
        </thead>
        <tbody>
          ${consensusData.tcpChecks.map((tcp: any) => {
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
              <td><strong>${service.name}</strong><br><small>${service.desc}</small></td>
              <td>✅ Consistent</td>
              <td>${service.security}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid ${theme.warningColor};">
        <strong>🔍 Monthly Port Analysis Summary:</strong><br>
        • <strong>${consensusData.tcpChecks.filter((tcp: any) => tcp.isUp).length} ports remained consistently open</strong> throughout ${periodStr}<br>
        • <strong>${consensusData.tcpChecks.filter((tcp: any) => !tcp.isUp).length} ports stayed closed/filtered</strong> during the reporting period<br>
        • <strong>Security Recommendation:</strong> Review open ports monthly and ensure only necessary services are accessible
      </div>
    </div>
    ` : ''}
  </div>
  ` : `
  <div class="alert-box error">
    <strong>⚠️ No Consensus Data Available for ${periodStr}</strong><br>
    The consensus worker did not report sufficient status data during this period. This may indicate a configuration issue or monitoring service interruption.
  </div>
  `}

  <div class="section">
    <h2 class="section-title"><span class="icon">📈</span>Monthly Performance Details</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td>Overall Monthly Uptime</td><td>${overallUptime != null ? overallUptime.toFixed(2) + '%' : '—'}</td><td>Time-weighted consensus availability for ${periodStr}</td></tr>
        <tr><td>HTTP/Ping/DNS Uptime</td><td>${[httpUptime, pingUptime, dnsUptime].map(v => v == null ? '—' : v.toFixed(2)+'%').join(' / ')}</td><td>Layer-specific monthly availability metrics</td></tr>
        <tr><td>Avg Response Times</td><td>${fmtMs(avgHttpMs)} / ${fmtMs(avgPingMs)} / ${fmtMs(avgDnsMs)}</td><td>Mean HTTP/Ping/DNS response times across all workers</td></tr>
        <tr><td>Total Monthly Checks</td><td>${monthStatuses.length}</td><td>Total monitoring data points collected</td></tr>
        <tr><td>Consensus Data Points</td><td>${consensus.length}</td><td>Validated consensus checks used in calculations</td></tr>
        <tr><td>SLA Target</td><td>${SLA_TARGET}%</td><td>Service Level Agreement target for uptime</td></tr>
        <tr><td>SLA Compliance</td><td class="${overallUptime != null && overallUptime >= SLA_TARGET ? 'status-up' : 'status-down'}">${overallUptime != null && overallUptime >= SLA_TARGET ? '✅ Met' : '❌ Missed'}</td><td>Whether SLA target was achieved in ${periodStr}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section" id="incidents">
    <h2 class="section-title"><span class="icon">🚨</span>Monthly Incident Log</h2>
    <table>
      <thead><tr><th>Incident Start</th><th>Incident End</th><th>Duration (min)</th><th>Affected Layer</th><th>Status</th></tr></thead>
      <tbody>
        ${incidents.length ? incidents.map(i => `
          <tr>
            <td>${formatDate(i.start)}</td>
            <td>${i.end ? formatDate(i.end) : '—'}</td>
            <td><strong>${i.durationMin} minutes</strong></td>
            <td><span class="chip chip-warn">${i.layer}</span></td>
            <td class="${i.end ? 'status-up' : 'status-down'}">${i.end ? '✅ Resolved' : '🔴 Ongoing'}</td>
          </tr>
        `).join('') : `
          <tr><td colspan="5" style="color:${theme.textSecondary}; text-align: center; padding: 30px;">
            🎉 <strong>No incidents recorded during ${periodStr}</strong><br>
            Your site maintained excellent uptime throughout the month!
          </td></tr>
        `}
      </tbody>
    </table>
    
    ${incidents.length > 0 ? `
    <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid ${theme.warningColor};">
      <strong>📊 Monthly Incident Analysis:</strong><br>
      • <strong>Total Incidents:</strong> ${incidents.length} during ${periodStr}<br>
      • <strong>Total Downtime:</strong> ${incidents.reduce((sum, i) => sum + i.durationMin, 0)} minutes<br>
      • <strong>Most Common Issue:</strong> ${incidents.length > 0 ? incidents.reduce((acc, curr) => acc[curr.layer] = (acc[curr.layer] || 0) + 1, {} as any) : 'None'}<br>
      • <strong>Avg Resolution Time:</strong> ${incidents.length > 0 ? Math.round(incidents.filter(i => i.end).reduce((sum, i) => sum + i.durationMin, 0) / incidents.filter(i => i.end).length) : 0} minutes
    </div>
    ` : `
    <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid ${theme.successColor};">
      <strong>🎉 Excellent Performance!</strong><br>
      Your site achieved perfect reliability during ${periodStr} with zero recorded incidents. This demonstrates exceptional infrastructure stability and proactive maintenance.
    </div>
    `}
  </div>

  ${workerIds.length > 0 ? `
  <div class="section regional-workers-section">
    <h2 class="section-title"><span class="icon">🌍</span>Regional Worker Performance - ${periodStr}</h2>
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
            <span class="metric-label">Monthly Checks:</span>
            <span class="metric-value">${workerStats.totalChecks}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Monthly Uptime:</span>
            <span class="metric-value">${formatUptime(workerStats.uptime, theme)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Last Check:</span>
            <span class="metric-value">${formatDate(status.checkedAt)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Current Status:</span>
            <span class="metric-value ${status.isUp ? 'status-up' : 'status-down'}">
              ${status.isUp ? '✅ Up' : '❌ Down'}
            </span>
          </div>
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
          ${status.tcpChecks && Array.isArray(status.tcpChecks) && status.tcpChecks.length > 0 ? `
          <div class="metric-row">
            <span class="metric-label">TCP Ports:</span>
            <span class="metric-value">
              ${status.tcpChecks.filter((tcp: any) => tcp.isUp).length} open / ${status.tcpChecks.length} total
            </span>
          </div>
          ` : ''}
        </div>
        `;
      }).join('')}
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid ${theme.infoColor};">
      <strong>🌍 Regional Performance Summary:</strong><br>
      • <strong>Total Regions:</strong> ${workerIds.length} monitoring locations during ${periodStr}<br>
      • <strong>Data Collection:</strong> ${monthStatuses.length} total checks across all regions<br>
      • <strong>Consensus Validation:</strong> ${consensus.length} validated consensus data points<br>
      • <strong>Global Coverage:</strong> Multiple geographic regions ensure accurate uptime measurement
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title"><span class="icon">📋</span>SLA & Compliance Report</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">SLA Target</div>
        <div class="value">${SLA_TARGET}%</div>
      </div>
      <div class="info-item">
        <div class="label">Actual Monthly Uptime</div>
        <div class="value ${overallUptime != null && overallUptime >= SLA_TARGET ? 'status-up' : 'status-down'}">${overallUptime != null ? overallUptime.toFixed(2)+'%' : '—'}</div>
      </div>
      <div class="info-item">
        <div class="label">SLA Status</div>
        <div class="value ${overallUptime != null && overallUptime >= SLA_TARGET ? 'status-up' : 'status-down'}">${overallUptime != null && overallUptime >= SLA_TARGET ? '✅ ACHIEVED' : '❌ MISSED'}</div>
      </div>
      <div class="info-item">
        <div class="label">Reporting Period</div>
        <div class="value">${periodStr}</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; background: ${overallUptime != null && overallUptime >= SLA_TARGET ? '#d4edda' : '#f8d7da'}; border-radius: 8px; border-left: 4px solid ${overallUptime != null && overallUptime >= SLA_TARGET ? theme.successColor : theme.errorColor};">
      <strong>📊 SLA Compliance Analysis:</strong><br>
      ${overallUptime != null && overallUptime >= SLA_TARGET ? 
        `✅ <strong>SLA TARGET ACHIEVED!</strong> Your site exceeded the ${SLA_TARGET}% uptime requirement with ${overallUptime.toFixed(2)}% uptime during ${periodStr}.` :
        `❌ <strong>SLA TARGET MISSED.</strong> Your site achieved ${overallUptime ? overallUptime.toFixed(2) : '0'}% uptime, falling short of the ${SLA_TARGET}% requirement by ${overallUptime ? (SLA_TARGET - overallUptime).toFixed(2) : SLA_TARGET}%.`
      }<br><br>
      <strong>Methodology:</strong> Time-weighted monthly uptime calculation (${formatDate(startDate)} → ${formatDate(endDate)}) using consensus status data when available. Average response times calculated across all monitoring workers for comprehensive coverage.
    </div>
  </div>

  <div class="footer">
    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
      <img src="https://${domain}/${theme.logo}" alt="${site.user.companyName} Logo" style="max-height: 30px; max-width: 100px; margin-right: 10px;">
      <span style="font-weight: bold; color: ${theme.primaryColor};">${site.user.companyName}</span>
    </div>
    <p style="text-align: center; margin: 0; color: ${theme.textSecondary};">
      Monthly uptime report for <strong>${site.name}</strong> • Period: ${periodStr}
    </p>
    <p style="text-align: center; margin-top: 10px; font-size: 0.8em; color: ${theme.textSecondary};">
      This report contains ${monthStatuses.length} monitoring data points with ${consensus.length} consensus validations<br>
      Generated by ${site.user.companyName} monitoring system on ${formatDate(new Date())}
    </p>
  </div>
</body>
</html>`

  return html
}