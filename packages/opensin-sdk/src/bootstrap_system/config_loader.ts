/**
 * OpenSIN Configuration Loader
 *
 * Loads configuration from multiple sources (defaults, environment, files, CLI)
 * with priority-based merging and source tracking.
 */

import type { ConfigSource, ConfigStore, ConfigValue, ConfigLoader } from './types.js'

const SOURCE_PRIORITY: ConfigSource[] = ['defaults', 'env', 'user', 'project', 'cli', 'remote']

class OpenSINConfigStore implements ConfigStore {
  private values: Map<string, ConfigValue> = new Map()

  get<T>(key: string, fallback?: T): T {
    const entry = this.values.get(key)
    if (entry) return entry.value as T
    return fallback as T
  }

  set(key: string, value: unknown, source: ConfigSource = 'cli'): void {
    this.values.set(key, { value, source, key })
  }

  has(key: string): boolean {
    return this.values.has(key)
  }

  delete(key: string): boolean {
    return this.values.delete(key)
  }

  getAll(): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {}
    for (const [key, value] of this.values) {
      result[key] = value
    }
    return result
  }

  getBySource(source: ConfigSource): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {}
    for (const [key, value] of this.values) {
      if (value.source === source) {
        result[key] = value
      }
    }
    return result
  }

  merge(overrides: Record<string, unknown>, source: ConfigSource): void {
    for (const [key, value] of Object.entries(overrides)) {
      const existing = this.values.get(key)
      if (!existing || SOURCE_PRIORITY.indexOf(source) >= SOURCE_PRIORITY.indexOf(existing.source)) {
        this.values.set(key, { value, source, key })
      }
    }
  }
}

export class OpenSINConfigLoader implements ConfigLoader {
  loadDefaults(): Record<string, unknown> {
    return {}
  }

  loadEnv(prefix: string): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const normalizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9_]/g, '') + '_'

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(normalizedPrefix) && value !== undefined) {
        const configKey = key
          .slice(normalizedPrefix.length)
          .toLowerCase()
          .replace(/_/g, '.')
        result[configKey] = this.parseEnvValue(value)
      }
    }

    return result
  }

  async loadFile(path: string): Promise<Record<string, unknown>> {
    try {
      const { readFile } = await import('fs/promises')
      const content = await readFile(path, 'utf-8')
      const ext = path.split('.').pop()?.toLowerCase()

      switch (ext) {
        case 'json':
          return JSON.parse(content)
        case 'yaml':
        case 'yml': {
          const yaml = await import('yaml')
          return yaml.parse(content)
        }
        case 'toml': {
          const toml = await import('smol-toml')
          return toml.parse(content)
        }
        case 'js':
        case 'mjs':
        case 'cjs': {
          const mod = await import(path)
          return mod.default ?? mod
        }
        default:
          return JSON.parse(content)
      }
    } catch {
      return {}
    }
  }

  loadCli(args: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (!arg || !arg.startsWith('--')) continue

      const key = arg.slice(2).replace(/-/g, '.')
      const nextArg = args[i + 1]

      if (nextArg !== undefined && !nextArg.startsWith('--')) {
        result[key] = this.parseCliValue(nextArg)
        i++
      } else {
        result[key] = true
      }
    }

    return result
  }

  resolve(sources: Record<ConfigSource, Record<string, unknown>>): ConfigStore {
    const store = new OpenSINConfigStore()

    for (const source of SOURCE_PRIORITY) {
      const data = sources[source]
      if (data && Object.keys(data).length > 0) {
        store.merge(data, source)
      }
    }

    return store
  }

  private parseEnvValue(value: string): unknown {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (value === 'undefined') return undefined

    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num

    if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }

    return value
  }

  private parseCliValue(value: string): unknown {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null

    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return num

    return value
  }
}

export function createConfigLoader(): OpenSINConfigLoader {
  return new OpenSINConfigLoader()
}
