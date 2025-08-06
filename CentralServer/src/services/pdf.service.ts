import * as pdf from 'html-pdf-node';
import { Site, SiteStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

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

interface SiteWithStatus {
    site: Site;
    status: {
        isUp: boolean | null;
        lastChecked: Date | null;
        pingUp: boolean | null;
        httpUp: boolean | null;
        uptime: {
            last24Hours: {
                overall: number;
                http: number;
                ping: number;
                totalChecks: number;
            };
        };
        ssl: {
            enabled: boolean;
            validFrom: Date | null;
            validTo: Date | null;
            issuer: string | null;
            daysUntilExpiry: number | null;
        } | null;
    };
}

class PDFService {
    private calculateUptimeStats(statusHistory: SiteStatus[]) {
        if (statusHistory.length === 0) {
            return {
                overall: 0,
                http: 0,
                ping: 0,
                totalChecks: 0
            };
        }

        const totalChecks = statusHistory.length;
        const upChecks = statusHistory.filter(status => status.isUp ?? false).length;
        const httpUpChecks = statusHistory.filter(status => status.httpIsUp ?? false).length;
        const pingUpChecks = statusHistory.filter(status => status.pingIsUp ?? false).length;

        return {
            overall: Math.round((upChecks / totalChecks) * 100 * 100) / 100 || 0,
            http: Math.round((httpUpChecks / totalChecks) * 100 * 100) / 100 || 0,
            ping: Math.round((pingUpChecks / totalChecks) * 100 * 100) / 100 || 0,
            totalChecks
        };
    }

    private formatDate(date: Date | null): string {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    }

    private formatUptime(uptime: number): string {
        return `${uptime.toFixed(2)}%`;
    }

    private getStatusText(isUp: boolean | null): string {
        if (isUp === null) return 'Unknown';
        return isUp ? '✓ Online' : '✗ Offline';
    }

    private getStatusColor(isUp: boolean | null): string {
        if (isUp === null) return '#666666';
        return isUp ? '#4CAF50' : '#F44336';
    }

    private async generateSitesReport(userId: string): Promise<Buffer> {
        try {
            const sites = await prisma.site.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        include: {
                            themeSettings: true
                        }
                    }
                }
            });

            const sitesWithStatus: SiteWithStatus[] = await Promise.all(
                sites.map(async (site) => {
                    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const statusHistory = await prisma.siteStatus.findMany({
                        where: {
                            siteId: site.id,
                            checkedAt: { gte: last24Hours }
                        },
                        orderBy: { checkedAt: 'desc' }
                    });

                    const latestStatus = statusHistory[0];
                    const uptimeStats = this.calculateUptimeStats(statusHistory);

                    return {
                        site,
                        status: {
                            isUp: latestStatus?.isUp ?? null,
                            lastChecked: latestStatus?.checkedAt ?? null,
                            pingUp: latestStatus?.pingIsUp ?? null,
                            httpUp: latestStatus?.httpIsUp ?? null,
                            uptime: {
                                last24Hours: uptimeStats
                            },
                            ssl: latestStatus ? {
                                enabled: latestStatus.hasSsl,
                                validFrom: latestStatus.sslValidFrom,
                                validTo: latestStatus.sslValidTo,
                                issuer: latestStatus.sslIssuer,
                                daysUntilExpiry: latestStatus.sslDaysUntilExpiry
                            } : null
                        }
                    };
                })
            );

            // Get user's theme settings for branding
            const user = sites[0]?.user;
            const themeSettings = user?.themeSettings || {
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

            // Calculate summary statistics
            const totalSites = sitesWithStatus.length;
            const onlineSites = sitesWithStatus.filter(s => s.status.isUp ?? false).length;
            const sitesWithSSL = sitesWithStatus.filter(s => s.status.ssl?.enabled).length;

            let averageOverallUptime = 0;
            let averageHttpUptime = 0;
            let averagePingUptime = 0;

            if (totalSites > 0) {
                const uptimes = sitesWithStatus.reduce((acc, s) => {
                    return {
                        overall: acc.overall + (s.status.uptime.last24Hours.overall || 0),
                        http: acc.http + (s.status.uptime.last24Hours.http || 0),
                        ping: acc.ping + (s.status.uptime.last24Hours.ping || 0)
                    };
                }, { overall: 0, http: 0, ping: 0 });

                averageOverallUptime = uptimes.overall / totalSites;
                averageHttpUptime = uptimes.http / totalSites;
                averagePingUptime = uptimes.ping / totalSites;
            }

            const performanceStatus = averageOverallUptime >= 99 ? 'Excellent'
                : averageOverallUptime >= 95 ? 'Good'
                    : averageOverallUptime >= 90 ? 'Fair'
                        : 'Needs Attention';

            const performanceColor = averageOverallUptime >= 99 ? '#4CAF50'
                : averageOverallUptime >= 95 ? '#2196F3'
                    : averageOverallUptime >= 90 ? '#FFC107'
                        : '#F44336';

            // Generate HTML content
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sites Status Report</title>
                    <style>
                        body {
                            font-family: '${themeSettings.fontPrimary}', Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            color: ${themeSettings.textPrimary};
                            background-color: #ffffff;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 3px solid ${themeSettings.primaryColor};
                            padding-bottom: 20px;
                        }
                        .header-logo {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 15px;
                        }
                        .header-logo img {
                            max-height: 40px;
                            max-width: 120px;
                            margin-right: 15px;
                        }
                        .header h1 {
                            color: ${themeSettings.primaryColor};
                            margin: 0;
                            font-size: 32px;
                            font-weight: bold;
                        }
                        .header p {
                            color: ${themeSettings.textSecondary};
                            margin: 10px 0 0 0;
                            font-size: 14px;
                        }
                        .summary-section {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 30px;
                            gap: 20px;
                        }
                        .summary-box {
                            flex: 1;
                            border: 2px solid ${themeSettings.primaryColor};
                            border-radius: 8px;
                            padding: 20px;
                            background-color: #f8f9fa;
                        }
                        .summary-box h3 {
                            color: ${themeSettings.primaryColor};
                            margin: 0 0 15px 0;
                            text-align: center;
                            font-size: 18px;
                        }
                        .summary-box p {
                            margin: 8px 0;
                            text-align: center;
                            font-size: 14px;
                        }
                        .performance-status {
                            font-size: 24px;
                            font-weight: bold;
                            text-align: center;
                            margin: 10px 0;
                        }
                        .sites-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            font-size: 12px;
                        }
                        .sites-table th {
                            background-color: ${themeSettings.primaryColor};
                            color: white;
                            padding: 12px 8px;
                            text-align: center;
                            font-weight: bold;
                        }
                        .sites-table td {
                            padding: 10px 8px;
                            text-align: center;
                            border-bottom: 1px solid #e0e0e0;
                        }
                        .sites-table tr:nth-child(even) {
                            background-color: #f5f5f5;
                        }
                        .status-online {
                            color: ${themeSettings.successColor};
                            font-weight: bold;
                        }
                        .status-offline {
                            color: ${themeSettings.errorColor};
                            font-weight: bold;
                        }
                        .status-unknown {
                            color: ${themeSettings.textSecondary};
                            font-weight: bold;
                        }
                        .ssl-info {
                            font-size: 11px;
                            line-height: 1.3;
                        }
                        .footer {
                            margin-top: 40px;
                            text-align: center;
                            color: ${themeSettings.textSecondary};
                            font-size: 12px;
                            border-top: 2px solid ${themeSettings.primaryColor};
                            padding-top: 20px;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="header-logo">
                            ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
                                `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${user?.companyName || 'Company'} Logo">` :
                                `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${user?.companyName || 'Company'} Logo">`
                            }
                            <span style="font-weight: bold; color: ${themeSettings.primaryColor}; font-size: 24px;">${user?.companyName || 'Monitoring System'}</span>
                        </div>
                        <h1>Sites Status Report</h1>
                        <p>Comprehensive Monitoring Overview</p>
                        <p>Report Generated: ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="summary-section">
                        <div class="summary-box">
                            <h3>Site Status Overview</h3>
                            <p>Total Sites Monitored: ${totalSites}</p>
                            <p>Currently Online: ${onlineSites} (${totalSites > 0 ? Math.round((onlineSites / totalSites) * 100) : 0}%)</p>
                            <p>Sites with SSL: ${sitesWithSSL} (${totalSites > 0 ? Math.round((sitesWithSSL / totalSites) * 100) : 0}%)</p>
                        </div>
                        <div class="summary-box">
                            <h3>Average Uptime Statistics</h3>
                            <p>Overall Uptime: ${averageOverallUptime.toFixed(2)}%</p>
                            <p>HTTP Uptime: ${averageHttpUptime.toFixed(2)}%</p>
                            <p>Ping Uptime: ${averagePingUptime.toFixed(2)}%</p>
                        </div>
                        <div class="summary-box">
                            <h3>Overall Performance</h3>
                            <div class="performance-status" style="color: ${performanceColor};">${performanceStatus}</div>
                        </div>
                    </div>

                    <div class="page-break"></div>

                    <table class="sites-table">
                        <thead>
                            <tr>
                                <th>Site Name</th>
                                <th>Status</th>
                                <th>Overall Uptime</th>
                                <th>HTTP Uptime</th>
                                <th>Ping Uptime</th>
                                <th>SSL Status</th>
                                <th>Last Checked</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sitesWithStatus.map(siteData => {
                                const sslInfo = siteData.status.ssl
                                    ? `Valid (${siteData.status.ssl.daysUntilExpiry || 'N/A'} days)<br>Issuer: ${siteData.status.ssl.issuer || 'Unknown'}`
                                    : 'No SSL';

                                const statusClass = siteData.status.isUp === null ? 'status-unknown' : 
                                                  siteData.status.isUp ? 'status-online' : 'status-offline';

                                return `
                                    <tr>
                                        <td>${siteData.site.name || 'N/A'}</td>
                                        <td class="${statusClass}">${this.getStatusText(siteData.status.isUp)}</td>
                                        <td>${this.formatUptime(siteData.status.uptime.last24Hours.overall || 0)}</td>
                                        <td>${this.formatUptime(siteData.status.uptime.last24Hours.http || 0)}</td>
                                        <td>${this.formatUptime(siteData.status.uptime.last24Hours.ping || 0)}</td>
                                        <td class="ssl-info">${sslInfo}</td>
                                        <td>${this.formatDate(siteData.status.lastChecked)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                            ${themeSettings.logo && themeSettings.logo !== 'logo.png' ?
                                `<img src="data:image/png;base64,${await getBase64FromPath(themeSettings.logo)}" alt="${user?.companyName || 'Company'} Logo" style="max-height: 30px; max-width: 100px; margin-right: 10px;">` :
                                `<img src="data:image/png;base64,${await getBase64FromPath('logo.png')}" alt="${user?.companyName || 'Company'} Logo" style="max-height: 30px; max-width: 100px; margin-right: 10px;">`
                            }
                            <span style="font-weight: bold; color: ${themeSettings.primaryColor};">${user?.companyName || 'Monitoring System'}</span>
                        </div>
                        <p>This report contains monitoring data for ${totalSites} sites</p>
                        <p>For technical support or questions about this report, please contact your monitoring provider.</p>
                    </div>
                </body>
                </html>
            `;

            // Generate PDF with options
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
                        ${user?.companyName || 'Monitoring System'} - Sites Status Report
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
                        Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}
                    </div>
                `,
            };

            const pdfBuffer = await pdf.generatePdf(file, options) as unknown as Buffer;

            // Validate that we got a buffer
            if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
                throw new Error('PDF generation failed - invalid buffer returned');
            }

            return pdfBuffer;

        } catch (error) {
            logger.error('Error generating PDF report:', error);
            throw error;
        }
    }

    public async generateReport(userId: string): Promise<Buffer> {
        try {
            return await this.generateSitesReport(userId);
        } catch (error) {
            logger.error('Error in PDF generation:', error);
            throw error;
        }
    }
}

export default new PDFService(); 