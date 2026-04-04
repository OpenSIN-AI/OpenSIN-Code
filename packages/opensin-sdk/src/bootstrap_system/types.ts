/**
 * OpenSIN Bootstrap System — Type Definitions
 *
 * Core types for system initialization, configuration loading,
 * and plugin discovery within the OpenSIN framework.
 */

/** Unique identifier for a plugin */
export type PluginId = string

/** Plugin lifecycle state */
export type PluginState = 'discovered' | 'loading' | 'loaded' | 'active' | 'error' | 'disabled'

/** Configuration source priority */
export type ConfigSource = 'defaults' | 'env' | 'user' | 'project' | 'cli' | 'remote'

/** Plugin manifest describing capabilities and metadata */
export interface PluginManifest {
  id: PluginId
  name: string
  version: string
  description: string
  author?: string
  homepage?: string
  entryPoint: string
  dependencies?: PluginId[]
  optionalDependencies?: PluginId[]
  capabilities?: string[]
  minSdkVersion?: string
  settingsSchema?: Record<string, unknown>
}

/** Resolved plugin with runtime information */
export interface ResolvedPlugin {
  manifest: PluginManifest
  path: string
  state: PluginState
  instance?: unknown
  loadError?: Error
  loadedAt?: number
}

/** Configuration value with source tracking */
export interface ConfigValue<T = unknown> {
  value: T
  source: ConfigSource
  key: string
}

/** Configuration store holding all resolved settings */
export interface ConfigStore {
  get<T>(key: string, fallback?: T): T
  set(key: string, value: unknown, source?: ConfigSource): void
  has(key: string): boolean
  delete(key: string): boolean
  getAll(): Record<string, ConfigValue>
  getBySource(source: ConfigSource): Record<string, ConfigValue>
  merge(overrides: Record<string, unknown>, source: ConfigSource): void
}

/** Bootstrap configuration options */
export interface BootstrapOptions {
  /** Root directory for the project */
  projectRoot: string
  /** Path to user-level config */
  userConfigPath?: string
  /** Path to project-level config */
  projectConfigPath?: string
  /** Plugin directories to scan */
  pluginDirs?: string[]
  /** Environment variable prefix */
  envPrefix?: string
  /** Enable verbose logging during bootstrap */
  verbose?: boolean
  /** Strict mode — fail on config errors */
  strict?: boolean
  /** Additional default values */
  defaults?: Record<string, unknown>
}

/** Bootstrap result after initialization */
export interface BootstrapResult {
  config: ConfigStore
  plugins: ResolvedPlugin[]
  projectRoot: string
  sessionId: string
  startTime: number
  duration: number
  warnings: string[]
  errors: Error[]
}

/** Plugin loader interface */
export interface PluginLoader {
  discover(dirs: string[]): Promise<PluginManifest[]>
  load(manifest: PluginManifest, path: string): Promise<ResolvedPlugin>
  unload(pluginId: PluginId): Promise<void>
  getPlugin(pluginId: PluginId): ResolvedPlugin | undefined
  getAllPlugins(): ResolvedPlugin[]
  getActivePlugins(): ResolvedPlugin[]
}

/** Config loader interface */
export interface ConfigLoader {
  loadDefaults(): Record<string, unknown>
  loadEnv(prefix: string): Record<string, unknown>
  loadFile(path: string): Promise<Record<string, unknown>>
  loadCli(args: string[]): Record<string, unknown>
  resolve(sources: Record<ConfigSource, Record<string, unknown>>): ConfigStore
}

/** Initializer orchestrating the bootstrap sequence */
export interface Initializer {
  initialize(options: BootstrapOptions): Promise<BootstrapResult>
  shutdown(): Promise<void>
  isInitialized(): boolean
}

/** Bootstrap event emitted during initialization */
export type BootstrapEvent =
  | { type: 'bootstrap_start'; timestamp: number }
  | { type: 'config_loaded'; source: ConfigSource; keyCount: number; timestamp: number }
  | { type: 'plugin_discovered'; pluginId: PluginId; path: string; timestamp: number }
  | { type: 'plugin_loaded'; pluginId: PluginId; duration: number; timestamp: number }
  | { type: 'plugin_error'; pluginId: PluginId; error: string; timestamp: number }
  | { type: 'bootstrap_complete'; duration: number; timestamp: number }
  | { type: 'bootstrap_error'; error: string; timestamp: number }
