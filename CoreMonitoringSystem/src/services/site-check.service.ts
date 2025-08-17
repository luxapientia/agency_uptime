import https from 'https';
import http from 'http';
import { TLSSocket } from 'tls';
import { URL } from 'url';
import ping from 'ping';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

export interface SiteCheckPingResult {
  isUp: boolean;
  status: number;
  responseTime: number;
  error?: string;
}

export interface SiteCheckSslResult {
  validFrom: Date;
  validTo: Date;
  issuer: string;
  daysUntilExpiry: number;
}

export interface SiteCheckDnsResult {
  isResolved: boolean;
  addresses: string[];
  error?: string;
  nameservers?: string[];
  responseTime: number;
}

export interface SiteCheckTcpResult {
  isConnected: boolean;
  port: number;
  responseTime: number;
  error?: string;
}

export interface SiteCheckHttpResult {
  isUp: boolean;
  status: number;
  responseTime: number;
  headers?: Record<string, string>;
  ssl?: SiteCheckSslResult;
}

export interface SiteMonitorResult {
  url: string;
  checkedAt: Date;
  workerId: string;
  isUp: boolean;
  dnsCheck: SiteCheckDnsResult;
  tcpChecks: SiteCheckTcpResult[];
  pingCheck: SiteCheckPingResult;
  httpCheck: SiteCheckHttpResult;
}

export class SiteCheckService {
  private readonly timeout: number;
  private readonly workerId: string;
  private readonly dnsResolve4 = promisify(dns.resolve4);
  private readonly dnsResolveNs = promisify(dns.resolveNs);
  private readonly defaultPorts = [80, 443]; // Default ports to check

  constructor(workerId: string, timeoutMs = 30000) {
    this.timeout = timeoutMs;
    this.workerId = workerId;
  }

  async performTcpCheck(host: string, port: number): Promise<SiteCheckTcpResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();
      let isResolved = false;

      // Set timeout
      socket.setTimeout(this.timeout);

      socket.on('connect', () => {
        if (isResolved) return;
        isResolved = true;
        socket.destroy();
        resolve({
          isConnected: true,
          port,
          responseTime: Date.now() - startTime
        });
      });

      socket.on('timeout', () => {
        if (isResolved) return;
        isResolved = true;
        socket.destroy();
        resolve({
          isConnected: false,
          port,
          responseTime: Date.now() - startTime,
          error: 'Connection timed out'
        });
      });

      socket.on('error', (error) => {
        if (isResolved) return;
        isResolved = true;
        socket.destroy();
        resolve({
          isConnected: false,
          port,
          responseTime: Date.now() - startTime,
          error: error.message
        });
      });

      // Attempt connection
      socket.connect({
        host,
        port
      });
    });
  }

  async performTcpChecks(urlString: string, ports?: number[]): Promise<SiteCheckTcpResult[]> {
    const url = new URL(urlString);
    const portsToCheck = ports || this.defaultPorts;
    
    try {
      return await Promise.all(
        portsToCheck.map(port => this.performTcpCheck(url.hostname, port))
      );
    } catch (error) {
      // This shouldn't happen as performTcpCheck always resolves, but just in case
      return portsToCheck.map(port => ({
        isConnected: false,
        port,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'TCP check failed'
      }));
    }
  }

  async performDnsCheck(urlString: string): Promise<SiteCheckDnsResult> {
    const url = new URL(urlString);
    const startTime = Date.now();
    
    try {
      const [addresses, nameservers] = await Promise.all([
        this.dnsResolve4(url.hostname),
        this.dnsResolveNs(url.hostname).catch(() => [] as string[])
      ]);

      return {
        isResolved: addresses.length > 0,
        addresses,
        nameservers: nameservers,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isResolved: false,
        addresses: [],
        error: error instanceof Error ? error.message : 'DNS resolution failed',
        responseTime: Date.now() - startTime
      };
    }
  }

  async performPing(urlString: string): Promise<SiteCheckPingResult> {
    const url = new URL(urlString);
    
    try {
      const result = await ping.promise.probe(url.hostname, {
        timeout: this.timeout / 1000, // ping takes seconds
      });

      return {
        isUp: result.alive,
        status: result.alive ? 200 : 0,
        responseTime: typeof result.time === 'number' ? result.time : 0,
        error: result.alive ? undefined : 'Host not responding to ping',
      };
    } catch (error) {
      throw new Error(`Ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performHttpCheck(urlString: string, method: 'GET' | 'HEAD'): Promise<SiteCheckHttpResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      try {
        const url = new URL(urlString);
        const protocol = url.protocol === 'https:' ? https : http;

        const options = {
          method,
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          timeout: this.timeout,
          rejectUnauthorized: false,
          requestCert: true,
          agent: false,
          secureOptions: require('constants').SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION
        };

        const req = protocol.request(options, (res) => {
          const headers = res.headers;
          const isUp = res.statusCode ? res.statusCode !== 404 : false;

          // Get SSL certificate info if available
          const ssl = res.socket instanceof TLSSocket && 'getPeerCertificate' in res.socket
            ? this.getSSLInfo(res.socket as TLSSocket)
            : undefined;

          resolve({
            isUp,
            status: res.statusCode || 0,
            responseTime: Date.now() - startTime,
            headers: headers as Record<string, string>,
            ssl,
          });

          // Consume response data to free up memory
          res.resume();
        });

        req.on('error', (error) => {
          reject(error);
        });

        // Set timeout
        req.setTimeout(this.timeout, () => {
          req.destroy();
          reject(new Error('Request timed out'));
        });

        req.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  private getSSLInfo(socket: TLSSocket): SiteCheckSslResult | undefined {
    const cert = socket.getPeerCertificate(true);
    if (!cert) return undefined;

    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    const daysUntilExpiry = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      validFrom,
      validTo,
      issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
      daysUntilExpiry,
    };
  }

  /**
   * Perform all checks (DNS, TCP, PING, GET, HEAD) on a single URL
   */
  async monitorUrl(url: string, tcpPorts?: number[]): Promise<SiteMonitorResult> {
    const checkedAt = new Date();
    
    const [dnsCheck, tcpChecks, pingCheck, httpCheck] = await Promise.all([
      this.performDnsCheck(url).catch(error => ({
        isResolved: false,
        addresses: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0
      })),
      this.performTcpChecks(url, tcpPorts).catch(error => [{
        isConnected: false,
        port: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]),
      this.performPing(url).catch(error => ({
        isUp: false,
        status: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })),
      this.performHttpCheck(url, 'GET').catch(error => ({
        isUp: false,
        status: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })),
      this.performHttpCheck(url, 'HEAD').catch(error => ({
        isUp: false,
        status: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    ]);

    return {
      url,
      isUp: httpCheck.isUp,
      checkedAt,
      workerId: this.workerId,
      dnsCheck,
      tcpChecks,
      pingCheck,
      httpCheck,
    };
  }

  /**
   * Monitor multiple URLs in parallel
   */
  async monitorUrls(urls: string[], tcpPorts?: number[]): Promise<SiteMonitorResult[]> {
    return Promise.all(urls.map(url => this.monitorUrl(url, tcpPorts)));
  }
}
