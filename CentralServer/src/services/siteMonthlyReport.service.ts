import { PrismaClient, SiteStatus } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { kimiPredictiveService } from './kimiPredictive.service'

const prisma = new PrismaClient()
const SLA_TARGET = 99.9

// Reuse base64-logo approach like reports.routes.ts
async function getBase64FromPath(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(__dirname, '../../public', filePath)
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath)
      return imageBuffer.toString('base64')
    }
    const fallback = path.join(__dirname, '../../public/logo.png')
    if (fs.existsSync(fallback)) {
      return fs.readFileSync(fallback).toString('base64')
    }
    return ''
  } catch {
    return ''
  }
}

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
  if (totalMs <= 0) return null
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

function fmtUptime(u: number | null, theme: any) {
  if (u == null) return '—'
  const v = u.toFixed(2) + '%'
  if (u >= 99.9) return `<span style="color:${theme.successColor}; font-weight:700;">${v}</span>`
  if (u >= 95) return `<span style="color:${theme.warningColor}; font-weight:700;">${v}</span>`
  return `<span style="color:${theme.errorColor}; font-weight:700;">${v}</span>`
}

function fmtMs(n: number | null) { return n == null ? '—' : `${Math.round(n)}ms` }

export async function generateSiteMonthlyReportHTML(siteId: string): Promise<string> {
  // Compute previous calendar month window in UTC
  const now = new Date()
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))
  const periodStr = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { user: { include: { themeSettings: true } }, notificationSettings: true }
  })
  if (!site) throw new Error('Site not found')

  const theme = site.user.themeSettings || {
    primaryColor: '#1976d2', secondaryColor: '#9c27b0', successColor: '#2e7d32', errorColor: '#d32f2f', warningColor: '#ed6c02', infoColor: '#0288d1', textPrimary: '#111827', textSecondary: '#6b7280', logo: 'logo.png', fontPrimary: 'Roboto'
  }

  // statuses for the month + previous for seeding
  const [prev] = await prisma.siteStatus.findMany({ where: { siteId, checkedAt: { lt: startDate } }, orderBy: { checkedAt: 'desc' }, take: 1 })
  const monthStatuses = await prisma.siteStatus.findMany({ where: { siteId, checkedAt: { gte: startDate, lte: endDate } }, orderBy: { checkedAt: 'asc' } })
  const consensus = monthStatuses.filter(s => s.workerId === 'consensus_worker')
  const base: SiteStatus[] = (consensus.length ? consensus : monthStatuses).slice().sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime())
  if (prev && (base.length === 0 || prev.checkedAt < base[0].checkedAt)) base.unshift({ ...prev, checkedAt: startDate })
  else if (base.length > 0 && base[0].checkedAt > startDate) base.unshift({ ...base[0], checkedAt: startDate })
  if (base.length > 0 && base[base.length - 1].checkedAt < endDate) base.push({ ...base[base.length - 1], checkedAt: endDate })

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

  // Incidents over the month
  const incidents = buildIncidents(base, startDate, endDate)

  // AI sections (diagnosis + 30d prediction)
  let aiAvailable = false
  let aiAnalysis: any = null
  let aiPrediction: any = null
  try {
    const health = await kimiPredictiveService.getHealthStatus()
    aiAvailable = !!health.available
    if (aiAvailable) {
      try { aiAnalysis = await kimiPredictiveService.analyzeSiteHealth(siteId) } catch {}
      try { aiPrediction = await kimiPredictiveService.predictSiteStatus(siteId, '30d') } catch {}
    }
  } catch {}

  const logoBase64 = await getBase64FromPath(theme.logo || 'logo.png')
  const slaIcon = overallUptime == null ? '⚪' : (overallUptime >= SLA_TARGET ? '🟢' : (overallUptime >= (SLA_TARGET - 1) ? '🟡' : '🔴'))

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: '${theme.fontPrimary}', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px; background: rgb(255,255,255); color: ${theme.textPrimary}; line-height: 1.6; }
    .header { background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}); color: #fff; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .subtitle { font-size: 1.1em; opacity: 0.9; }
    .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); page-break-inside: avoid; break-inside: avoid; }
    .section-title { color: ${theme.primaryColor}; font-size: 1.6em; margin-bottom: 16px; display: flex; align-items: center; border-bottom: 2px solid ${theme.primaryColor}20; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap: 16px; margin-bottom: 10px; }
    .info-item { padding: 15px; background: #fff; border-radius: 8px; border-left: 3px solid ${theme.infoColor}; }
    .info-item .label { font-weight: 600; color: ${theme.textSecondary}; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item .value { font-size: 1.05em; margin-top: 6px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .card { background: #fff; border-radius: 10px; border: 1px solid #eee; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card h3 { margin: 0 0 6px 0; color: ${theme.textSecondary}; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 1.6em; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; background: white; }
    th { background: ${theme.primaryColor}; color: #fff; padding: 12px; text-align: left; font-size: 0.9em; }
    td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 0.9em; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    .chip { display:inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
    .chip-ok { background: #e8f5e9; color: ${theme.successColor}; }
    .chip-warn { background: #fff8e1; color: ${theme.warningColor}; }
    .chip-err { background: #ffebee; color: ${theme.errorColor}; }
    .status-up { color: ${theme.successColor}; font-weight: bold; }
    .status-down { color: ${theme.errorColor}; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom: 10px;">
      <img src="data:image/png;base64,${logoBase64}" alt="${site.user.companyName} Logo" style="max-height: 60px; max-width: 200px;"/>
      <div>
        <h1 style="margin:0;">Monthly Uptime Report</h1>
        <div class="subtitle">${site.name} • ${periodStr} • Generated: ${new Date().toUTCString()}</div>
      </div>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">${site.user.companyName}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Site Information</h2>
    <div class="info-grid">
      <div class="info-item"><div class="label">Site Name</div><div class="value">${site.name}</div></div>
      <div class="info-item"><div class="label">URL</div><div class="value">${site.url}</div></div>
      <div class="info-item"><div class="label">Check Interval</div><div class="value">${site.checkInterval} minutes</div></div>
      <div class="info-item"><div class="label">Status</div><div class="value">${site.isActive ? '✅ Active' : '❌ Inactive'}</div></div>
      <div class="info-item"><div class="label">Created</div><div class="value">${new Date(site.createdAt).toUTCString()}</div></div>
      <div class="info-item"><div class="label">Notifications</div><div class="value">${site.notificationSettings.length > 0 ? site.notificationSettings.map(n => n.type).join(', ') : 'None'}</div></div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Executive Snapshot</h2>
    <div class="cards">
      <div class="card"><h3>Overall Uptime vs SLA</h3><div class="value">${slaIcon} ${overallUptime != null ? overallUptime.toFixed(2) + '%' : '—'} <span class="chip ${overallUptime != null && overallUptime >= SLA_TARGET ? 'chip-ok' : 'chip-err'}" style="margin-left:6px;">SLA ${SLA_TARGET}%</span></div></div>
      <div class="card"><h3>HTTP Uptime</h3><div class="value">${fmtUptime(httpUptime, theme)}</div></div>
      <div class="card"><h3>Ping Uptime</h3><div class="value">${fmtUptime(pingUptime, theme)}</div></div>
      <div class="card"><h3>DNS Uptime</h3><div class="value">${fmtUptime(dnsUptime, theme)}</div></div>
      <div class="card"><h3>Avg HTTP Latency</h3><div class="value">${fmtMs(avgHttpMs)}</div></div>
      <div class="card"><h3>Avg Ping Latency</h3><div class="value">${fmtMs(avgPingMs)}</div></div>
      <div class="card"><h3>Avg DNS Latency</h3><div class="value">${fmtMs(avgDnsMs)}</div></div>
      <div class="card"><h3>Incidents</h3><div class="value">${incidents.length}</div></div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Monthly Performance Details</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td>Overall Uptime</td><td>${overallUptime != null ? overallUptime.toFixed(2) + '%' : '—'}</td><td>Time-weighted consensus availability for the month</td></tr>
        <tr><td>HTTP/Ping/DNS Uptime</td><td>${[httpUptime, pingUptime, dnsUptime].map(v => v == null ? '—' : v.toFixed(2)+'%').join(' / ')}</td><td>Layer-specific monthly availability</td></tr>
        <tr><td>Avg HTTP/Ping/DNS</td><td>${fmtMs(avgHttpMs)} / ${fmtMs(avgPingMs)} / ${fmtMs(avgDnsMs)}</td><td>Mean response times across all workers</td></tr>
        <tr><td>Total Checks</td><td>${base.length}</td><td>Consensus series points used in uptime calc</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section" id="incidents">
    <h2 class="section-title">Incident Log</h2>
    <table>
      <thead><tr><th>Start</th><th>End</th><th>Duration</th><th>Layer</th><th>Status</th></tr></thead>
      <tbody>
        ${incidents.length ? incidents.map(i => `<tr><td>${new Date(i.start).toUTCString()}</td><td>${i.end ? new Date(i.end).toUTCString() : '—'}</td><td>${i.durationMin} min</td><td>${i.layer}</td><td>${i.end ? 'Resolved' : 'Ongoing'}</td></tr>`).join('') : `<tr><td colspan="5" style="color:${theme.textSecondary}">No incidents recorded.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">AI-Powered Insights</h2>
    ${aiAvailable ? `
      ${aiAnalysis ? `
      <div class="info-grid">
        <div class="info-item"><div class="label">Severity</div><div class="value">${aiAnalysis.severity || '—'}</div></div>
        <div class="info-item"><div class="label">Diagnosis</div><div class="value">${aiAnalysis.diagnosis || '—'}</div></div>
      </div>
      ${Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length ? `
        <div class="info-item" style="border-left-color:${theme.successColor}">
          <div class="label">Top Recommendations</div>
          <div class="value"><ul style="margin:6px 0 0 18px;">${aiAnalysis.recommendations.slice(0,5).map((r: string) => `<li>${r}</li>`).join('')}</ul></div>
        </div>` : ''}
      ` : `<div style="color:${theme.textSecondary}">AI analysis unavailable for this period.</div>`}
      ${aiPrediction ? `
        <div class="info-grid" style="margin-top:12px;">
          <div class="info-item"><div class="label">Predicted Status (30d)</div><div class="value">${aiPrediction.predictedStatus || '—'}</div></div>
          <div class="info-item"><div class="label">Confidence</div><div class="value">${aiPrediction.confidence != null ? Math.round(aiPrediction.confidence*100)+'%' : '—'}</div></div>
        </div>
      ` : ''}
    ` : `<div style="color:${theme.textSecondary}">AI diagnostics are not configured.</div>`}
  </div>

  <div class="section">
    <h2 class="section-title">SLA & Compliance</h2>
    <div>Target SLA: ${SLA_TARGET}% • Actual: ${overallUptime != null ? overallUptime.toFixed(2)+'%' : '—'}</div>
    <div style="margin-top:8px;color:${theme.textSecondary}">Methodology: time-weighted monthly uptime (${startDate.toUTCString()} → ${endDate.toUTCString()}) using consensus status when available; averages taken across all workers for latency.</div>
  </div>
</body>
</html>`

  return html
} 