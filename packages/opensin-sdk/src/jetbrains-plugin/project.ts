/**
 * JetBrains IDE Project API
 */

import type { JetBrainsProjectInfo, JetBrainsModuleInfo, JetBrainsFileChange } from "./types.js";
import type { ProtocolClient } from "./protocol.js";

export class ProjectManager {
  private client: ProtocolClient;
  private projectInfo: JetBrainsProjectInfo | null = null;
  private changeListeners: Set<(change: JetBrainsFileChange) => void> = new Set();
  private moduleChangeListeners: Set<(modules: JetBrainsModuleInfo[]) => void> = new Set();

  constructor(client: ProtocolClient) {
    this.client = client;
  }

  onFileChange(listener: (change: JetBrainsFileChange) => void): void {
    this.changeListeners.add(listener);
  }

  onModuleChange(listener: (modules: JetBrainsModuleInfo[]) => void): void {
    this.moduleChangeListeners.add(listener);
  }

  async getInfo(): Promise<JetBrainsProjectInfo | null> {
    if (this.projectInfo) return this.projectInfo;
    const info = await this.client.getProjectInfo();
    if (info) {
      this.projectInfo = info;
    }
    return info;
  }

  async search(query: string, fileMask?: string): Promise<string[]> {
    return this.client.searchProject(query, fileMask);
  }

  async getFileTree(rootPath?: string): Promise<Record<string, unknown>[]> {
    return this.client.getFileTree(rootPath);
  }

  async getModules(): Promise<JetBrainsModuleInfo[]> {
    const info = await this.getInfo();
    return info?.modules ?? [];
  }

  async getVcsRoots(): Promise<string[]> {
    const info = await this.getInfo();
    return info?.vcsRoots ?? [];
  }

  async getProjectSettings(): Promise<Record<string, unknown> | null> {
    const response = await this.client.sendRequest("jetbrains/project/settings");
    return (response.result as Record<string, unknown>) ?? null;
  }

  async getVcsStatus(): Promise<Record<string, unknown> | null> {
    const response = await this.client.sendRequest("jetbrains/vcs/status");
    return (response.result as Record<string, unknown>) ?? null;
  }

  async getCurrentBranch(): Promise<string | null> {
    const response = await this.client.sendRequest("jetbrains/vcs/branch");
    return (response.result as string) ?? null;
  }

  async switchBranch(branchName: string): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/vcs/branch", { branchName });
    return !response.error;
  }

  async commit(message: string, files?: string[]): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/vcs/commit", { message, files });
    return !response.error;
  }

  async listActions(): Promise<Record<string, unknown>[]> {
    const response = await this.client.sendRequest("jetbrains/action/list");
    return (response.result as Record<string, unknown>[]) ?? [];
  }

  async executeAction(actionId: string, parameters?: Record<string, unknown>): Promise<boolean> {
    const response = await this.client.executeAction(actionId, parameters);
    return response.success;
  }

  async showNotification(type: "info" | "warning" | "error", title: string, message: string): Promise<void> {
    await this.client.showNotification({ type, title, message });
  }

  handleFileChange(change: JetBrainsFileChange): void {
    this.changeListeners.forEach((l) => l(change));
  }

  handleModuleChange(modules: JetBrainsModuleInfo[]): void {
    this.moduleChangeListeners.forEach((l) => l(modules));
    if (this.projectInfo) {
      this.projectInfo = { ...this.projectInfo, modules };
    }
  }

  refresh(): void {
    this.projectInfo = null;
  }
}
