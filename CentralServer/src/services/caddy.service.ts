import axios, { AxiosInstance } from 'axios';

interface Upstream {
  dial: string;
}

interface ReverseProxyHandler {
  handler: 'reverse_proxy';
  upstreams: Upstream[];
}

interface MatchRule {
  host: string[];
}

interface CaddyRoute {
  '@id': string;
  match: MatchRule[];
  handle: ReverseProxyHandler[];
  terminal: boolean;
}

export class CaddyService {
  private api: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:2019') {
    this.api = axios.create({ baseURL: baseUrl });
  }

  /**
   * Add a new route for a domain (HTTPS enabled)
   */
  async addDomain(domain: string, target: string): Promise<void> {
    const routeId = this.domainToRouteId(domain);

    try {
      const existingRoute = await this.api.get(`/id/${routeId}`);
      if (existingRoute.data) {
        console.log(`[-] Domain already exists: ${domain}`);
        return;
      }
    } catch (error: any) {
    }

    const routeConfig = {
      '@id': routeId,
      match: [{ host: [domain] }],
      handle: [
        {
          handler: 'subroute',
          routes: [{ handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: target }] }] }],
        },
      ],
      terminal: true,
    };

    try {
      await this.api.post('/config/apps/http/servers/srv0/routes', routeConfig);
      console.log(`[+] Domain added: ${domain} → ${target}`);
    } catch (error: any) {
      console.error(`[!] Failed to add domain ${domain}:`, error.response?.data || error.message);
    }
  }

  /**
   * Remove a domain route by domain name
   */
  async removeDomain(domain: string): Promise<void> {
    const routeId = this.domainToRouteId(domain);

    try {
      await this.api.delete(`/id/${routeId}`);
      console.log(`[-] Domain removed: ${domain}`);
    } catch (error: any) {
      console.error(`[!] Failed to remove domain ${domain}:`, error.response?.data || error.message);
    }
  }

  /**
   * Get full Caddy configuration
   */
  async getConfig(): Promise<any> {
    try {
      const response = await this.api.get('/config/');
      return response.data;
    } catch (error: any) {
      console.error(`[!] Failed to fetch config:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Utility to generate consistent route ID
   */
  private domainToRouteId(domain: string): string {
    return `route-${domain.replace(/\./g, '-')}`;
  }
}
