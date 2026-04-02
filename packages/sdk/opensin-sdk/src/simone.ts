import { execa } from 'execa';

export interface SimoneOptions {
  endpoint?: string;
  timeout?: number;
}

export class Simone {
  private options: Required<SimoneOptions>;

  constructor(options: SimoneOptions = {}) {
    this.options = {
      endpoint: options.endpoint ?? 'local',
      timeout: options.timeout ?? 30000,
    };
  }

  async findSymbol(name: string, filePath?: string): Promise<any[]> {
    // Simone MCP integration — calls sincode with simone MCP
    const args = ['sincode', 'run', `Find symbol: ${name}${filePath ? ` in ${filePath}` : ''}`];
    const { stdout } = await execa(args[0], args.slice(1), { timeout: this.options.timeout });
    return JSON.parse(stdout);
  }

  async findReferences(name: string, filePath: string): Promise<any[]> {
    const args = ['sincode', 'run', `Find references to: ${name} in ${filePath}`];
    const { stdout } = await execa(args[0], args.slice(1), { timeout: this.options.timeout });
    return JSON.parse(stdout);
  }

  async replaceSymbol(name: string, filePath: string, newBody: string): Promise<boolean> {
    const args = ['sincode', 'run', `Replace symbol ${name} in ${filePath} with: ${newBody}`];
    const { stdout } = await execa(args[0], args.slice(1), { timeout: this.options.timeout });
    return stdout.includes('success');
  }
}
