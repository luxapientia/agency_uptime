import PDFDocument from 'pdfkit';
import { Site, SiteStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const prisma = new PrismaClient();

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
    private readonly TABLE_LAYOUT = {
        headerColor: '#2196F3',
        alternateRowColor: '#f5f5f5',
        textColor: '#333333',
        borderColor: '#e0e0e0',
        fontSize: 10,
        padding: 8,
    };

    private async generateSitesReport(userId: string): Promise<Buffer> {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A3',
            layout: 'landscape'
        });
        const chunks: Buffer[] = [];

        return new Promise(async (resolve, reject) => {
            doc.on('data', chunks.push.bind(chunks));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            try {
                const sites = await prisma.site.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
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

                this.generatePDFContent(doc, sitesWithStatus);
                doc.end();

            } catch (error) {
                logger.error('Error generating PDF report:', error);
                reject(error);
            }
        });
    }

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

    private drawTableRow(
        doc: typeof PDFDocument.prototype,
        columns: { text: string; width: number }[],
        yPosition: number,
        isHeader = false,
        isAlternate = false
    ) {
        // Ensure yPosition is a valid number
        if (typeof yPosition !== 'number' || isNaN(yPosition)) {
            yPosition = 50; // Default to top margin if invalid
        }

        const startX = 50; // Left margin
        const availableWidth = doc.page.width - (startX * 2); // Total width minus margins
        const rowHeight = this.TABLE_LAYOUT.padding * 2 + 20; // Increased height for better vertical spacing

        // Draw background
        if (isHeader || isAlternate) {
            doc
                .fillColor(isHeader ? this.TABLE_LAYOUT.headerColor : this.TABLE_LAYOUT.alternateRowColor)
                .rect(startX, yPosition, availableWidth, rowHeight)
                .fill();
        }

        // Draw text for each column
        let xPosition = startX;
        columns.forEach(column => {
            const width = typeof column.width === 'number' && !isNaN(column.width)
                ? column.width
                : availableWidth / columns.length;

            const text = String(column.text || '');

            // Calculate text height to center vertically
            const textHeight = doc
                .fontSize(this.TABLE_LAYOUT.fontSize)
                .heightOfString(text, {
                    width: width - (this.TABLE_LAYOUT.padding * 2),
                    align: 'center'
                });

            // Calculate vertical position to center text
            const verticalPadding = (rowHeight - textHeight) / 2;
            const textY = yPosition + verticalPadding;

            doc
                .fillColor(isHeader ? 'white' : this.TABLE_LAYOUT.textColor)
                .fontSize(this.TABLE_LAYOUT.fontSize)
                .text(
                    text,
                    xPosition + this.TABLE_LAYOUT.padding,
                    textY,
                    {
                        width: width - (this.TABLE_LAYOUT.padding * 2),
                        align: 'center',
                        lineBreak: true, // Enable line breaks for multi-line content
                        height: rowHeight - (verticalPadding * 2) // Constrain height
                    }
                );

            xPosition += width;
        });

        // Draw vertical lines
        xPosition = startX;
        columns.forEach(column => {
            const width = typeof column.width === 'number' && !isNaN(column.width)
                ? column.width
                : availableWidth / columns.length;

            // Draw only if coordinates are valid numbers
            if (!isNaN(xPosition) && !isNaN(yPosition)) {
                doc
                    .strokeColor(this.TABLE_LAYOUT.borderColor)
                    .moveTo(xPosition, yPosition)
                    .lineTo(xPosition, yPosition + rowHeight)
                    .stroke();
            }
            xPosition += width;
        });

        // Draw final vertical line
        if (!isNaN(xPosition) && !isNaN(yPosition)) {
            doc
                .strokeColor(this.TABLE_LAYOUT.borderColor)
                .moveTo(xPosition, yPosition)
                .lineTo(xPosition, yPosition + rowHeight)
                .stroke();
        }

        // Draw horizontal lines
        if (!isNaN(startX) && !isNaN(yPosition)) {
            doc
                .strokeColor(this.TABLE_LAYOUT.borderColor)
                .moveTo(startX, yPosition)
                .lineTo(startX + availableWidth, yPosition)
                .stroke();

            doc
                .strokeColor(this.TABLE_LAYOUT.borderColor)
                .moveTo(startX, yPosition + rowHeight)
                .lineTo(startX + availableWidth, yPosition + rowHeight)
                .stroke();
        }

        return yPosition + rowHeight;
    }

    private generatePDFContent(doc: typeof PDFDocument.prototype, sitesWithStatus: SiteWithStatus[]) {
        let currentPage = 1;
        const margin = 50;

        // Add title and header
        doc
            .fontSize(32)
            .fillColor('#2196F3')
            .text('Sites Status Report', { align: 'center' })
            .moveDown(0.5);

        // doc
        //     .fontSize(14)
        //     .fillColor('#666666')
        //     .text('Comprehensive Monitoring Overview', { align: 'center' })
        //     .moveDown(0.5);

        doc
            .fontSize(12)
            .fillColor('#666666')
            .text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'right' })
            .moveDown(0.5);

        // Define table columns
        const totalTableWidth = doc.page.width - (margin * 2);
        const columns = [
            { text: 'Site Name', width: totalTableWidth * 0.15 },
            { text: 'Status', width: totalTableWidth * 0.08 },
            { text: 'Overall Uptime', width: totalTableWidth * 0.12 },
            { text: 'HTTP Uptime', width: totalTableWidth * 0.12 },
            { text: 'Ping Uptime', width: totalTableWidth * 0.12 },
            { text: 'SSL Status', width: totalTableWidth * 0.25 },
            { text: 'Last Checked', width: totalTableWidth * 0.16 }
        ];

        // Draw table header on first page
        let yPosition = doc.y;
        yPosition = this.drawTableRow(doc, columns, yPosition, true);

        // Draw table rows
        sitesWithStatus.forEach((siteData, index) => {
            // Calculate next row height
            const rowHeight = this.TABLE_LAYOUT.padding * 2 + 20;

            // Check if we need a new page
            if (yPosition + rowHeight > doc.page.height - doc.page.margins.bottom) {
                // // Add page number to the current page (before creating a new one)
                // doc
                //     .fontSize(10)
                //     .fillColor('#666666')
                //     .text(`Page ${currentPage}`, 0, doc.page.height - 40, { align: 'center' });

                doc.addPage();
                currentPage++;
                yPosition = doc.page.margins.top;

                // Redraw table header on new page
                yPosition = this.drawTableRow(doc, columns, yPosition, true);
            }

            const sslInfo = siteData.status.ssl
                ? `Valid (${siteData.status.ssl.daysUntilExpiry || 'N/A'} days)\nIssuer: ${siteData.status.ssl.issuer || 'Unknown'}`
                : 'No SSL';

            const rowData = [
                { text: siteData.site.name || 'N/A', width: columns[0].width },
                {
                    text: siteData.status.isUp ? '✓ Online' : '✗ Offline',
                    width: columns[1].width
                },
                {
                    text: `${(siteData.status.uptime.last24Hours.overall || 0).toFixed(2)}%`,
                    width: columns[2].width
                },
                {
                    text: `${(siteData.status.uptime.last24Hours.http || 0).toFixed(2)}%`,
                    width: columns[3].width
                },
                {
                    text: `${(siteData.status.uptime.last24Hours.ping || 0).toFixed(2)}%`,
                    width: columns[4].width
                },
                {
                    text: sslInfo,
                    width: columns[5].width
                },
                {
                    text: siteData.status.lastChecked
                        ? new Date(siteData.status.lastChecked).toLocaleString()
                        : 'Never',
                    width: columns[6].width
                }
            ];

            yPosition = this.drawTableRow(doc, rowData, yPosition, false, index % 2 === 1);
        });

        doc.addPage();
        // Summary Header
        doc
            .fontSize(24)
            .fillColor('#2196F3')
            .text('Performance Summary', { underline: true })
            .moveDown(1);

        const totalSites = sitesWithStatus.length;
        const onlineSites = sitesWithStatus.filter(s => s.status.isUp ?? false).length;
        const sitesWithSSL = sitesWithStatus.filter(s => s.status.ssl?.enabled).length;

        // Calculate average uptimes
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

        // Draw summary boxes
        const boxWidth = (doc.page.width - 150) / 3;
        const boxHeight = 100;
        const boxY = doc.y;

        // Site Status Box
        doc
            .rect(50, boxY, boxWidth, boxHeight)
            .fillAndStroke('#f5f5f5', '#e0e0e0');
        doc
            .fontSize(16)
            .fillColor('#2196F3')
            .text('Site Status Overview', 60, boxY + 10, { width: boxWidth - 20, align: 'center' })
            .fontSize(12)
            .fillColor('#333333')
            .text(`Total Sites Monitored: ${totalSites}`, 60, boxY + 35, { width: boxWidth - 20, align: 'center' })
            .text(`Currently Online: ${onlineSites} (${totalSites > 0 ? Math.round((onlineSites / totalSites) * 100) : 0}%)`, 60, boxY + 55, { width: boxWidth - 20, align: 'center' })
            .text(`Sites with SSL: ${sitesWithSSL} (${totalSites > 0 ? Math.round((sitesWithSSL / totalSites) * 100) : 0}%)`, 60, boxY + 75, { width: boxWidth - 20, align: 'center' });

        // Uptime Statistics Box
        doc
            .rect(50 + boxWidth + 25, boxY, boxWidth, boxHeight)
            .fillAndStroke('#f5f5f5', '#e0e0e0');
        doc
            .fontSize(16)
            .fillColor('#2196F3')
            .text('Average Uptime Statistics', 60 + boxWidth + 25, boxY + 10, { width: boxWidth - 20, align: 'center' })
            .fontSize(12)
            .fillColor('#333333')
            .text(`Overall Uptime: ${averageOverallUptime.toFixed(2)}%`, 60 + boxWidth + 25, boxY + 35, { width: boxWidth - 20, align: 'center' })
            .text(`HTTP Uptime: ${averageHttpUptime.toFixed(2)}%`, 60 + boxWidth + 25, boxY + 55, { width: boxWidth - 20, align: 'center' })
            .text(`Ping Uptime: ${averagePingUptime.toFixed(2)}%`, 60 + boxWidth + 25, boxY + 75, { width: boxWidth - 20, align: 'center' });

        // Performance Indicators Box
        const performanceStatus = averageOverallUptime >= 99 ? 'Excellent'
            : averageOverallUptime >= 95 ? 'Good'
                : averageOverallUptime >= 90 ? 'Fair'
                    : 'Needs Attention';

        const performanceColor = averageOverallUptime >= 99 ? '#4CAF50'
            : averageOverallUptime >= 95 ? '#2196F3'
                : averageOverallUptime >= 90 ? '#FFC107'
                    : '#F44336';

        doc
            .rect(50 + (boxWidth + 25) * 2, boxY, boxWidth, boxHeight)
            .fillAndStroke('#f5f5f5', '#e0e0e0');
        doc
            .fontSize(16)
            .fillColor('#2196F3')
            .text('Overall Performance', 60 + (boxWidth + 25) * 2, boxY + 10, { width: boxWidth - 20, align: 'center' })
            .fontSize(20)
            .fillColor(performanceColor)
            .text(performanceStatus, 60 + (boxWidth + 25) * 2, boxY + 45, { width: boxWidth - 20, align: 'center' });
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