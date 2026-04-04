/**
 * OpenSIN Bootstrap Initializer
 *
 * Orchestrates the full bootstrap sequence: config loading, plugin discovery,
 * and system initialization with event emission and error handling.
 */

import { randomUUID } from 'crypto'
import { resolve } from 'path'
import type {
  BootstrapOptions,
  BootstrapResult,
  BootstrapEvent,
  ConfigSource,
  Initializer,
} from './types.js'
import { OpenSINConfigLoader } from './config_loader.js'
import { OpenSINPluginLoader } from './plugin_loader.js'

type EventHandler = (event: BootstrapEvent) => void

export class OpenSINInitializer implements Initializer {
  private configLoader: OpenSINConfigLoader
  private pluginLoader: OpenSINPluginLoader
  private initialized = false
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private result: BootstrapResult | null = null

  constructor() {
    this.configLoader = new OpenSINConfigLoader()
    this.pluginLoader = new OpenSINPluginLoader()
  }

  async initialize(options: BootstrapOptions): Promise<BootstrapResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const errors: Error[] = []

    this.emit({ type: 'bootstrap_start', timestamp: startTime })

    try {
      const projectRoot = resolve(options.projectRoot)

      // Phase 1: Load configuration
      const config = await this.loadConfig(options, warnings, errors)

      // Phase 2: Discover and load plugins
      const plugins = await this.loadPlugins(options, warnings, errors)

      const duration = Date.now() - startTime

      this.result = {
        config,
        plugins,
        projectRoot,
        sessionId: randomUUID(),
        startTime,
        duration,
        warnings,
        errors,
      }

      this.initialized = true

      this.emit({
        type: 'bootstrap_complete',
        duration,
        timestamp: Date.now(),
      })

      return this.result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err)

      this.emit({
        type: 'bootstrap_error',
        error: err.message,
        timestamp: Date.now(),
      })

      if (options.strict) {
        throw err
      }

      return {
        config: this.configLoader.resolve({ defaults: options.defaults ?? {} } as Record<ConfigSource, Record<string, unknown>>),
        plugins: [],
        projectRoot: resolve(options.projectRoot),
        sessionId: randomUUID(),
        startTime,
        duration: Date.now() - startTime,
        warnings,
        errors,
      }
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return

    const activePlugins = this.pluginLoader.getActivePlugins()
    await Promise.allSettled(
      activePlugins.map((p) => this.pluginLoader.unload(p.manifest.id))
    )

    this.initialized = false
    this.result = null
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getResult(): BootstrapResult | null {
    return this.result
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  private async loadConfig(
    options: BootstrapOptions,
    warnings: string[],
    errors: Error[]
  ) {
    const sources: Partial<Record<ConfigSource, Record<string, unknown>>> = {}

    // Defaults
    sources.defaults = options.defaults ?? {}
    this.emit({
      type: 'config_loaded',
      source: 'defaults',
      keyCount: Object.keys(sources.defaults).length,
      timestamp: Date.now(),
    })

    // Environment variables
    const envPrefix = options.envPrefix ?? 'OPENSIN'
    sources.env = this.configLoader.loadEnv(envPrefix)
    this.emit({
      type: 'config_loaded',
      source: 'env',
      keyCount: Object.keys(sources.env).length,
      timestamp: Date.now(),
    })

    // User config file
    if (options.userConfigPath) {
      sources.user = await this.configLoader.loadFile(options.userConfigPath)
      if (Object.keys(sources.user).length === 0) {
        warnings.push(`User config file not found or empty: ${options.userConfigPath}`)
      }
      this.emit({
        type: 'config_loaded',
        source: 'user',
        keyCount: Object.keys(sources.user).length,
        timestamp: Date.now(),
      })
    }

    // Project config file
    if (options.projectConfigPath) {
      sources.project = await this.configLoader.loadFile(options.projectConfigPath)
      if (Object.keys(sources.project).length === 0) {
        warnings.push(`Project config file not found or empty: ${options.projectConfigPath}`)
      }
      this.emit({
        type: 'config_loaded',
        source: 'project',
        keyCount: Object.keys(sources.project).length,
        timestamp: Date.now(),
      })
    }

    return this.configLoader.resolve(sources as Record<ConfigSource, Record<string, unknown>>)
  }

  private async loadPlugins(
    options: BootstrapOptions,
    warnings: string[],
    errors: Error[]
  ) {
    const pluginDirs = options.pluginDirs ?? []
    if (pluginDirs.length === 0) return []

    const manifests = await this.pluginLoader.discover(pluginDirs)

    for (const manifest of manifests) {
      this.emit({
        type: 'plugin_discovered',
        pluginId: manifest.id,
        path: pluginDirs.find((d) => true) ?? '',
        timestamp: Date.now(),
      })
    }

    const plugins = []
    for (const manifest of manifests) {
      const pluginPath = pluginDirs[0] ?? ''
      const loadStart = Date.now()

      const resolved = await this.pluginLoader.load(manifest, pluginPath)
      const duration = Date.now() - loadStart

      if (resolved.state === 'error') {
        errors.push(resolved.loadError ?? new Error(`Failed to load plugin ${manifest.id}`))
        this.emit({
          type: 'plugin_error',
          pluginId: manifest.id,
          error: resolved.loadError?.message ?? 'Unknown error',
          timestamp: Date.now(),
        })
      } else {
        this.emit({
          type: 'plugin_loaded',
          pluginId: manifest.id,
          duration,
          timestamp: Date.now(),
        })
      }

      plugins.push(resolved)
    }

    return plugins
  }

  private emit(event: BootstrapEvent): void {
    const typeHandlers = this.handlers.get(event.type) ?? new Set()
    const allHandlers = this.handlers.get('*') ?? new Set()

    for (const handler of [...typeHandlers, ...allHandlers]) {
      try {
        handler(event)
      } catch {
        // Ignore handler errors during bootstrap
      }
    }
  }
}

export function createInitializer(): OpenSINInitializer {
  return new OpenSINInitializer()
}
