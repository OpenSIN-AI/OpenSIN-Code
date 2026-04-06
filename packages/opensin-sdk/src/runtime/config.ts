import * as fs from 'fs';
import * as path from 'path';
import { JsonValue } from './json';
import { SandboxConfig, FilesystemIsolationMode } from './sandbox';

export const SIN_SETTINGS_SCHEMA_NAME = 'SettingsSchema';

export enum ConfigSource {
  User = 'user',
  Project = 'project',
  Local = 'local',
}

export enum ResolvedPermissionMode {
  ReadOnly = 'readOnly',
  WorkspaceWrite = 'workspaceWrite',
  DangerFullAccess = 'dangerFullAccess',
}

export interface ConfigEntry {
  source: ConfigSource;
  path: string;
}

export interface RuntimeConfig {
  merged: Map<string, JsonValue>;
  loadedEntries: ConfigEntry[];
  featureConfig: RuntimeFeatureConfig;
}

export interface RuntimePluginConfig {
  enabledPlugins: Map<string, boolean>;
  externalDirectories: string[];
  installRoot: string | null;
  registryPath: string | null;
  bundledRoot: string | null;
}

export interface RuntimeFeatureConfig {
  hooks: RuntimeHookConfig;
  plugins: RuntimePluginConfig;
  mcp: McpConfigCollection;
  oauth: OAuthConfig | null;
  model: string | null;
  permissionMode: ResolvedPermissionMode | null;
  sandbox: SandboxConfig;
}

export interface RuntimeHookConfig {
  preToolUse: string[];
  postToolUse: string[];
}

export interface McpConfigCollection {
  servers: Map<string, ScopedMcpServerConfig>;
}

export interface ScopedMcpServerConfig {
  scope: ConfigSource;
  config: McpServerConfig;
}

export enum McpTransport {
  Stdio = 'stdio',
  Sse = 'sse',
  Http = 'http',
  Ws = 'ws',
  Sdk = 'sdk',
  ManagedProxy = 'managedProxy',
}

export type McpServerConfig =
  | { type: 'stdio'; config: McpStdioServerConfig }
  | { type: 'sse'; config: McpRemoteServerConfig }
  | { type: 'http'; config: McpRemoteServerConfig }
  | { type: 'ws'; config: McpWebSocketServerConfig }
  | { type: 'sdk'; config: McpSdkServerConfig }
  | { type: 'managedProxy'; config: McpManagedProxyServerConfig };

export interface McpStdioServerConfig {
  command: string;
  args: string[];
  env: Map<string, string>;
}

export interface McpRemoteServerConfig {
  url: string;
  headers: Map<string, string>;
  headersHelper: string | null;
  oauth: McpOAuthConfig | null;
}

export interface McpWebSocketServerConfig {
  url: string;
  headers: Map<string, string>;
  headersHelper: string | null;
}

export interface McpSdkServerConfig {
  name: string;
}

export interface McpManagedProxyServerConfig {
  url: string;
  id: string;
}

export interface McpOAuthConfig {
  clientId: string | null;
  callbackPort: number | null;
  authServerMetadataUrl: string | null;
  xaa: boolean | null;
}

export interface OAuthConfig {
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  callbackPort: number | null;
  manualRedirectUrl: string | null;
  scopes: string[];
}

export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ConfigLoader {
  private cwd: string;
  private configHome: string;

  constructor(cwd: string, configHome: string) {
    this.cwd = cwd;
    this.configHome = configHome;
  }

  static defaultFor(cwd: string): ConfigLoader {
    const configHome = defaultConfigHome();
    return new ConfigLoader(cwd, configHome);
  }

  getConfigHome(): string {
    return this.configHome;
  }

  discover(): ConfigEntry[] {
    const userLegacyPath = path.dirname(this.configHome) || '.sin.json';
    
    return [
      {
        source: ConfigSource.User,
        path: userLegacyPath,
      },
      {
        source: ConfigSource.User,
        path: path.join(this.configHome, 'settings.json'),
      },
      {
        source: ConfigSource.Project,
        path: path.join(this.cwd, '.sin.json'),
      },
      {
        source: ConfigSource.Project,
        path: path.join(this.cwd, '.sin', 'settings.json'),
      },
      {
        source: ConfigSource.Local,
        path: path.join(this.cwd, '.sin', 'settings.local.json'),
      },
    ];
  }

  load(): RuntimeConfig {
    const merged = new Map<string, JsonValue>();
    const loadedEntries: ConfigEntry[] = [];
    const mcpServers = new Map<string, ScopedMcpServerConfig>();

    for (const entry of this.discover()) {
      const value = readOptionalJsonObject(entry.path);
      if (!value) continue;
      
      mergeMcpServers(mcpServers, entry.source, value, entry.path);
      deepMergeObjects(merged, value);
      loadedEntries.push(entry);
    }

    const mergedValue = mapToJsonValue(merged);

    const featureConfig: RuntimeFeatureConfig = {
      hooks: parseOptionalHooksConfig(mergedValue),
      plugins: parseOptionalPluginConfig(mergedValue),
      mcp: { servers: mcpServers },
      oauth: parseOptionalOAuthConfig(mergedValue, 'merged settings.oauth'),
      model: parseOptionalModel(mergedValue),
      permissionMode: parseOptionalPermissionMode(mergedValue),
      sandbox: parseOptionalSandboxConfig(mergedValue),
    };

    return {
      merged,
      loadedEntries,
      featureConfig,
    };
  }
}

export function createEmptyRuntimeConfig(): RuntimeConfig {
  return {
    merged: new Map(),
    loadedEntries: [],
    featureConfig: createDefaultRuntimeFeatureConfig(),
  };
}

export function createDefaultRuntimeFeatureConfig(): RuntimeFeatureConfig {
  return {
    hooks: createDefaultRuntimeHookConfig(),
    plugins: createDefaultRuntimePluginConfig(),
    mcp: { servers: new Map() },
    oauth: null,
    model: null,
    permissionMode: null,
    sandbox: createDefaultSandboxConfig(),
  };
}

export function createDefaultRuntimeHookConfig(): RuntimeHookConfig {
  return { preToolUse: [], postToolUse: [] };
}

export function createDefaultRuntimePluginConfig(): RuntimePluginConfig {
  return {
    enabledPlugins: new Map(),
    externalDirectories: [],
    installRoot: null,
    registryPath: null,
    bundledRoot: null,
  };
}

function createDefaultSandboxConfig(): SandboxConfig {
  return {
    enabled: null,
    namespaceRestrictions: null,
    networkIsolation: null,
    filesystemMode: null,
    allowedMounts: [],
  };
}

export function getRuntimeConfigMerged(config: RuntimeConfig): Map<string, JsonValue> {
  return config.merged;
}

export function getRuntimeConfigLoadedEntries(config: RuntimeConfig): ConfigEntry[] {
  return config.loadedEntries;
}

export function getRuntimeConfig(config: RuntimeConfig, key: string): JsonValue | undefined {
  return config.merged.get(key);
}

export function getRuntimeConfigAsJson(config: RuntimeConfig): JsonValue {
  return mapToJsonValue(config.merged);
}

export function getRuntimeConfigFeatureConfig(config: RuntimeConfig): RuntimeFeatureConfig {
  return config.featureConfig;
}

export function getRuntimeConfigMcp(config: RuntimeConfig): McpConfigCollection {
  return config.featureConfig.mcp;
}

export function getRuntimeConfigHooks(config: RuntimeConfig): RuntimeHookConfig {
  return config.featureConfig.hooks;
}

export function getRuntimeConfigPlugins(config: RuntimeConfig): RuntimePluginConfig {
  return config.featureConfig.plugins;
}

export function getRuntimeConfigOAuth(config: RuntimeConfig): OAuthConfig | null {
  return config.featureConfig.oauth;
}

export function getRuntimeConfigModel(config: RuntimeConfig): string | null {
  return config.featureConfig.model;
}

export function getRuntimeConfigPermissionMode(config: RuntimeConfig): ResolvedPermissionMode | null {
  return config.featureConfig.permissionMode;
}

export function getRuntimeConfigSandbox(config: RuntimeConfig): SandboxConfig {
  return config.featureConfig.sandbox;
}

export function runtimeFeatureConfigWithHooks(
  config: RuntimeFeatureConfig,
  hooks: RuntimeHookConfig
): RuntimeFeatureConfig {
  return { ...config, hooks };
}

export function runtimeFeatureConfigWithPlugins(
  config: RuntimeFeatureConfig,
  plugins: RuntimePluginConfig
): RuntimeFeatureConfig {
  return { ...config, plugins };
}

export function runtimeFeatureConfigGetHooks(config: RuntimeFeatureConfig): RuntimeHookConfig {
  return config.hooks;
}

export function runtimeFeatureConfigGetPlugins(config: RuntimeFeatureConfig): RuntimePluginConfig {
  return config.plugins;
}

export function runtimeFeatureConfigGetMcp(config: RuntimeFeatureConfig): McpConfigCollection {
  return config.mcp;
}

export function runtimeFeatureConfigGetOAuth(config: RuntimeFeatureConfig): OAuthConfig | null {
  return config.oauth;
}

export function runtimeFeatureConfigGetModel(config: RuntimeFeatureConfig): string | null {
  return config.model;
}

export function runtimeFeatureConfigGetPermissionMode(
  config: RuntimeFeatureConfig
): ResolvedPermissionMode | null {
  return config.permissionMode;
}

export function runtimeFeatureConfigGetSandbox(config: RuntimeFeatureConfig): SandboxConfig {
  return config.sandbox;
}

export function runtimePluginConfigGetEnabledPlugins(
  config: RuntimePluginConfig
): Map<string, boolean> {
  return config.enabledPlugins;
}

export function runtimePluginConfigGetExternalDirectories(config: RuntimePluginConfig): string[] {
  return config.externalDirectories;
}

export function runtimePluginConfigGetInstallRoot(config: RuntimePluginConfig): string | null {
  return config.installRoot;
}

export function runtimePluginConfigGetRegistryPath(config: RuntimePluginConfig): string | null {
  return config.registryPath;
}

export function runtimePluginConfigGetBundledRoot(config: RuntimePluginConfig): string | null {
  return config.bundledRoot;
}

export function runtimePluginConfigSetPluginState(
  config: RuntimePluginConfig,
  pluginId: string,
  enabled: boolean
): void {
  config.enabledPlugins.set(pluginId, enabled);
}

export function runtimePluginConfigStateFor(
  config: RuntimePluginConfig,
  pluginId: string,
  defaultEnabled: boolean
): boolean {
  return config.enabledPlugins.get(pluginId) ?? defaultEnabled;
}

export function defaultConfigHome(): string {
  const envConfig = process.env.SIN_CONFIG_HOME;
  if (envConfig) return envConfig;
  
  const home = process.env.HOME;
  if (home) return path.join(home, '.sin');
  
  return '.sin';
}

export function runtimeHookConfigNew(preToolUse: string[], postToolUse: string[]): RuntimeHookConfig {
  return { preToolUse, postToolUse };
}

export function runtimeHookConfigGetPreToolUse(config: RuntimeHookConfig): string[] {
  return config.preToolUse;
}

export function runtimeHookConfigGetPostToolUse(config: RuntimeHookConfig): string[] {
  return config.postToolUse;
}

export function runtimeHookConfigMerged(a: RuntimeHookConfig, b: RuntimeHookConfig): RuntimeHookConfig {
  const merged = { ...a };
  merged.preToolUse = extendUnique([...a.preToolUse], b.preToolUse);
  merged.postToolUse = extendUnique([...a.postToolUse], b.postToolUse);
  return merged;
}

export function runtimeHookConfigExtend(a: RuntimeHookConfig, b: RuntimeHookConfig): void {
  extendUnique(a.preToolUse, b.preToolUse);
  extendUnique(a.postToolUse, b.postToolUse);
}

export function mcpConfigCollectionGetServers(config: McpConfigCollection): Map<string, ScopedMcpServerConfig> {
  return config.servers;
}

export function mcpConfigCollectionGet(config: McpConfigCollection, name: string): ScopedMcpServerConfig | undefined {
  return config.servers.get(name);
}

export function scopedMcpServerConfigGetTransport(config: ScopedMcpServerConfig): McpTransport {
  return config.config.type as McpTransport;
}

function readOptionalJsonObject(filePath: string): Map<string, JsonValue> | null {
  const isLegacyConfig = path.basename(filePath) === '.sin.json';
  
  let contents: string;
  try {
    contents = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new ConfigError(`Failed to read ${filePath}`, error as Error);
  }

  if (contents.trim().length === 0) {
    return new Map();
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    if (isLegacyConfig) return null;
    throw new ConfigError(`${filePath}: ${(error as Error).message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    if (isLegacyConfig) return null;
    throw new ConfigError(`${filePath}: top-level settings value must be a JSON object`);
  }

  return parsed as Map<string, JsonValue>;
}

function mergeMcpServers(
  target: Map<string, ScopedMcpServerConfig>,
  source: ConfigSource,
  root: Map<string, JsonValue>,
  filePath: string
): void {
  const mcpServersValue = root.get('mcpServers');
  if (!mcpServersValue || typeof mcpServersValue !== 'object') return;

  const servers = mcpServersValue as Map<string, JsonValue>;
  for (const [name, value] of servers) {
    const parsed = parseMcpServerConfig(
      name,
      value,
      `${filePath}: mcpServers.${name}`
    );
    target.set(name, { scope: source, config: parsed });
  }
}

function parseOptionalModel(root: Map<string, JsonValue>): string | null {
  const obj = root.get('model');
  if (typeof obj === 'string') return obj;
  return null;
}

function parseOptionalHooksConfig(root: Map<string, JsonValue>): RuntimeHookConfig {
  const obj = root.get('hooks');
  if (!obj || typeof obj !== 'object') return createDefaultRuntimeHookConfig();

  const hooks = obj as Map<string, JsonValue>;
  return {
    preToolUse: optionalStringArray(hooks, 'preToolUse') || [],
    postToolUse: optionalStringArray(hooks, 'postToolUse') || [],
  };
}

function parseOptionalPluginConfig(root: Map<string, JsonValue>): RuntimePluginConfig {
  const config = createDefaultRuntimePluginConfig();

  const enabledPlugins = root.get('enabledPlugins');
  if (enabledPlugins && typeof enabledPlugins === 'object') {
    config.enabledPlugins = parseBoolMap(enabledPlugins as Map<string, JsonValue>);
  }

  const pluginsValue = root.get('plugins');
  if (!pluginsValue || typeof pluginsValue !== 'object') return config;

  const plugins = pluginsValue as Map<string, JsonValue>;
  
  const enabledValue = plugins.get('enabled');
  if (enabledValue && typeof enabledValue === 'object') {
    config.enabledPlugins = parseBoolMap(enabledValue as Map<string, JsonValue>);
  }
  
  config.externalDirectories = optionalStringArray(plugins, 'externalDirectories') || [];
  config.installRoot = optionalString(plugins, 'installRoot') || null;
  config.registryPath = optionalString(plugins, 'registryPath') || null;
  config.bundledRoot = optionalString(plugins, 'bundledRoot') || null;
  
  return config;
}

function parseOptionalPermissionMode(root: Map<string, JsonValue>): ResolvedPermissionMode | null {
  const mode = optionalString(root, 'permissionMode');
  if (mode) return parsePermissionModeLabel(mode, 'merged settings.permissionMode');

  const permissions = root.get('permissions');
  if (permissions && typeof permissions === 'object') {
    const defaultMode = optionalString(permissions as Map<string, JsonValue>, 'defaultMode');
    if (defaultMode) {
      return parsePermissionModeLabel(defaultMode, 'merged settings.permissions.defaultMode');
    }
  }
  return null;
}

function parsePermissionModeLabel(mode: string, context: string): ResolvedPermissionMode {
  switch (mode) {
    case 'default':
    case 'plan':
    case 'read-only':
      return ResolvedPermissionMode.ReadOnly;
    case 'acceptEdits':
    case 'auto':
    case 'workspace-write':
      return ResolvedPermissionMode.WorkspaceWrite;
    case 'dontAsk':
    case 'danger-full-access':
      return ResolvedPermissionMode.DangerFullAccess;
    default:
      throw new ConfigError(`${context}: unsupported permission mode ${mode}`);
  }
}

function parseOptionalSandboxConfig(root: Map<string, JsonValue>): SandboxConfig {
  const sandboxValue = root.get('sandbox');
  if (!sandboxValue || typeof sandboxValue !== 'object') return createDefaultSandboxConfig();

  const sandbox = sandboxValue as Map<string, JsonValue>;
  const filesystemModeValue = optionalString(sandbox, 'filesystemMode');
  const filesystemMode = filesystemModeValue 
    ? parseFilesystemModeLabel(filesystemModeValue)
    : null;

  return {
    enabled: optionalBool(sandbox, 'enabled'),
    namespaceRestrictions: optionalBool(sandbox, 'namespaceRestrictions'),
    networkIsolation: optionalBool(sandbox, 'networkIsolation'),
    filesystemMode,
    allowedMounts: optionalStringArray(sandbox, 'allowedMounts') || [],
  };
}

function parseFilesystemModeLabel(value: string): FilesystemIsolationMode {
  switch (value) {
    case 'off': return FilesystemIsolationMode.Off;
    case 'workspace-only': return FilesystemIsolationMode.WorkspaceOnly;
    case 'allow-list': return FilesystemIsolationMode.AllowList;
    default:
      throw new ConfigError(`merged settings.sandbox.filesystemMode: unsupported filesystem mode ${value}`);
  }
}

function parseOptionalOAuthConfig(
  root: Map<string, JsonValue>,
  context: string
): OAuthConfig | null {
  const oauthValue = root.get('oauth');
  if (!oauthValue || typeof oauthValue !== 'object') return null;

  const oauth = oauthValue as Map<string, JsonValue>;
  return {
    clientId: expectString(oauth, 'clientId', context),
    authorizeUrl: expectString(oauth, 'authorizeUrl', context),
    tokenUrl: expectString(oauth, 'tokenUrl', context),
    callbackPort: optionalU16(oauth, 'callbackPort'),
    manualRedirectUrl: optionalString(oauth, 'manualRedirectUrl'),
    scopes: optionalStringArray(oauth, 'scopes') || [],
  };
}

function parseMcpServerConfig(
  serverName: string,
  value: JsonValue,
  context: string
): McpServerConfig {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigError(`${context}: expected JSON object`);
  }

  const obj = value as Map<string, JsonValue>;
  const serverType = optionalString(obj, 'type') || 'stdio';

  switch (serverType) {
    case 'stdio':
      return {
        type: 'stdio',
        config: {
          command: expectString(obj, 'command', context),
          args: optionalStringArray(obj, 'args') || [],
          env: optionalStringMap(obj, 'env') || new Map(),
        },
      };
    case 'sse':
      return { type: 'sse', config: parseMcpRemoteServerConfig(obj, context) };
    case 'http':
      return { type: 'http', config: parseMcpRemoteServerConfig(obj, context) };
    case 'ws':
      return {
        type: 'ws',
        config: {
          url: expectString(obj, 'url', context),
          headers: optionalStringMap(obj, 'headers') || new Map(),
          headersHelper: optionalString(obj, 'headersHelper'),
        },
      };
    case 'sdk':
      return {
        type: 'sdk',
        config: { name: expectString(obj, 'name', context) },
      };
    case 'claudeai-proxy':
      return {
        type: 'managedProxy',
        config: {
          url: expectString(obj, 'url', context),
          id: expectString(obj, 'id', context),
        },
      };
    default:
      throw new ConfigError(
        `${context}: unsupported MCP server type for ${serverName}: ${serverType}`
      );
  }
}

function parseMcpRemoteServerConfig(
  obj: Map<string, JsonValue>,
  context: string
): McpRemoteServerConfig {
  return {
    url: expectString(obj, 'url', context),
    headers: optionalStringMap(obj, 'headers') || new Map(),
    headersHelper: optionalString(obj, 'headersHelper'),
    oauth: parseOptionalMcpOAuthConfig(obj, context),
  };
}

function parseOptionalMcpOAuthConfig(
  obj: Map<string, JsonValue>,
  context: string
): McpOAuthConfig | null {
  const value = obj.get('oauth');
  if (!value || typeof value !== 'object') return null;

  const oauth = value as Map<string, JsonValue>;
  return {
    clientId: optionalString(oauth, 'clientId'),
    callbackPort: optionalU16(oauth, 'callbackPort'),
    authServerMetadataUrl: optionalString(oauth, 'authServerMetadataUrl'),
    xaa: optionalBool(oauth, 'xaa'),
  };
}

function expectString(obj: Map<string, JsonValue>, key: string, context: string): string {
  const value = obj.get(key);
  if (typeof value === 'string') return value;
  throw new ConfigError(`${context}: missing string field ${key}`);
}

function optionalString(obj: Map<string, JsonValue>, key: string): string | null {
  const value = obj.get(key);
  if (value === undefined) return null;
  if (typeof value === 'string') return value;
  throw new ConfigError(`field ${key} must be a string`);
}

function optionalBool(obj: Map<string, JsonValue>, key: string): boolean | null {
  const value = obj.get(key);
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value;
  throw new ConfigError(`field ${key} must be a boolean`);
}

function optionalU16(obj: Map<string, JsonValue>, key: string): number | null {
  const value = obj.get(key);
  if (value === undefined) return null;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65535) {
    return value;
  }
  throw new ConfigError(`field ${key} must be an integer`);
}

function optionalStringArray(obj: Map<string, JsonValue>, key: string): string[] | null {
  const value = obj.get(key);
  if (value === undefined) return null;
  if (!Array.isArray(value)) throw new ConfigError(`field ${key} must be an array`);
  return value.map((item, i) => {
    if (typeof item !== 'string') {
      throw new ConfigError(`field ${key}[${i}] must be a string`);
    }
    return item;
  });
}

function optionalStringMap(obj: Map<string, JsonValue>, key: string): Map<string, string> | null {
  const value = obj.get(key);
  if (value === undefined) return null;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ConfigError(`field ${key} must be an object`);
  }
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(value)) {
    if (typeof v !== 'string') throw new ConfigError(`field ${key}.${k} must be a string`);
    map.set(k, v);
  }
  return map;
}

function parseBoolMap(value: Map<string, JsonValue>): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const [key, val] of value) {
    if (typeof val !== 'boolean') throw new ConfigError(`field ${key} must be a boolean`);
    map.set(key, val);
  }
  return map;
}

function deepMergeObjects(
  target: Map<string, JsonValue>,
  source: Map<string, JsonValue>
): void {
  for (const [key, value] of source) {
    const existing = target.get(key);
    if (
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing) &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      deepMergeObjects(existing as Map<string, JsonValue>, value as Map<string, JsonValue>);
    } else {
      target.set(key, value);
    }
  }
}

function extendUnique(target: string[], values: string[]): string[] {
  for (const value of values) {
    if (!target.includes(value)) {
      target.push(value);
    }
  }
  return target;
}

function mapToJsonValue(map: Map<string, JsonValue>): JsonValue {
  const obj: Record<string, JsonValue> = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}