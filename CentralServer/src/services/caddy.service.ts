import fs from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';
import { config } from '../config/index';

const execAsync = util.promisify(exec);

class CaddyManager {
  private caddyfilePath = '/etc/caddy/Caddyfile';
  private target = `http://127.0.0.1:${config.port}`;

  constructor(private readonly baseTemplatePath = './base.Caddyfile') { }

  async domainExists(domain: string): Promise<boolean> {
    const caddyfile = await fs.readFile(this.caddyfilePath, 'utf8');
    const domainPattern = new RegExp(`^\\s*${domain.replace(/\./g, '\\.')}\\s*{`, 'm');
    return domainPattern.test(caddyfile);
  }

  private async reloadCaddy(): Promise<void> {
    try {
      await execAsync('sudo systemctl reload caddy');
    } catch (error: any) {
      throw new Error(`Failed to reload Caddy: ${error.stderr || error.message}`);
    }
  }

  private generateBlock(domain: string): string {
    return `
${domain} {
  reverse_proxy ${this.target}
}`;
  }

  async addDomain(domain: string): Promise<void> {
    if (await this.domainExists(domain)) {
      throw new Error(`Domain ${domain} already exists in Caddyfile.`);
    }

    const block = this.generateBlock(domain);
    const current = await fs.readFile(this.caddyfilePath, 'utf8');

    const updated = `${current.trim()}\n\n${block.trim()}\n`;
    await fs.writeFile(this.caddyfilePath, updated, 'utf8');

    await this.reloadCaddy();
    console.log(`[+] Added ${domain} → ${this.target}`);
  }

  async removeDomain(domain: string): Promise<void> {
    const current = await fs.readFile(this.caddyfilePath, 'utf8');
    const domainBlockRegex = new RegExp(`${domain.replace(/\./g, '\\.')}\\s*{[^}]*}`, 'gs');
    const updated = current.replace(domainBlockRegex, '').trim();

    await fs.writeFile(this.caddyfilePath, updated + '\n', 'utf8');
    await this.reloadCaddy();
    console.log(`[-] Removed ${domain}`);
  }
}

export default new CaddyManager();