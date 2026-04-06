export enum FilesystemIsolationMode {
  Off = 'off',
  WorkspaceOnly = 'workspaceOnly',
  AllowList = 'allowList',
}

export interface SandboxConfig {
  enabled: boolean | null;
  namespaceRestrictions: boolean | null;
  networkIsolation: boolean | null;
  filesystemMode: FilesystemIsolationMode | null;
  allowedMounts: string[];
}

export function createDefaultSandboxConfig(): SandboxConfig {
  return {
    enabled: null,
    namespaceRestrictions: null,
    networkIsolation: null,
    filesystemMode: null,
    allowedMounts: [],
  };
}

export function sandboxConfigWithEnabled(config: SandboxConfig, enabled: boolean): SandboxConfig {
  return { ...config, enabled };
}

export function sandboxConfigWithFilesystemMode(
  config: SandboxConfig,
  mode: FilesystemIsolationMode
): SandboxConfig {
  return { ...config, filesystemMode: mode };
}

export function sandboxConfigWithAllowedMounts(
  config: SandboxConfig,
  mounts: string[]
): SandboxConfig {
  return { ...config, allowedMounts: mounts };
}