/**
 * OpenSIN Plugin Loader
 *
 * Discovers, loads, and manages plugins with lifecycle tracking
 * and dependency resolution.
 */

import { existsSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import type {
  PluginId,
  PluginManifest,
  PluginState,
  ResolvedPlugin,
  PluginLoader,
} from './types'

const MANIFEST_FILES = ['opensin-plugin.json', 'plugin.json', 'package.json']

export class OpenSINPluginLoader implements PluginLoader {
  private plugins: Map<PluginId, ResolvedPlugin> = new Map()

  async discover(dirs: string[]): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = []

    for (const dir of dirs) {
      if (!existsSync(dir)) continue

      const entries = readdirSync(dir)
      for (const entry of entries) {
        const entryPath = join(dir, entry)
        if (!statSync(entryPath).isDirectory()) continue

        const manifest = await this.findManifest(entryPath)
        if (manifest) {
          manifests.push(manifest)
        }
      }
    }

    return manifests
  }

  async load(manifest: PluginManifest, path: string): Promise<ResolvedPlugin> {
    const existing = this.plugins.get(manifest.id)
    if (existing) {
      return existing
    }

    const resolved: ResolvedPlugin = {
      manifest,
      path,
      state: 'loading',
    }

    this.plugins.set(manifest.id, resolved)

    try {
      const entryPath = resolve(path, manifest.entryPoint)
      if (!existsSync(entryPath)) {
        throw new Error(`Plugin entry point not found: ${entryPath}`)
      }

      const mod = await import(entryPath)
      resolved.instance = mod.default ?? mod
      resolved.state = 'loaded'
      resolved.loadedAt = Date.now()
    } catch (error) {
      resolved.state = 'error'
      resolved.loadError = error instanceof Error ? error : new Error(String(error))
    }

    return resolved
  }

  async unload(pluginId: PluginId): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    if (plugin.instance && typeof (plugin.instance as { shutdown?: () => void }).shutdown === 'function') {
      try {
        await (plugin.instance as { shutdown: () => void }).shutdown()
      } catch {
        // Ignore shutdown errors
      }
    }

    this.plugins.delete(pluginId)
  }

  getPlugin(pluginId: PluginId): ResolvedPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  getAllPlugins(): ResolvedPlugin[] {
    return Array.from(this.plugins.values())
  }

  getActivePlugins(): ResolvedPlugin[] {
    return this.getAllPlugins().filter((p) => p.state === 'loaded' || p.state === 'active')
  }

  async resolveDependencies(plugins: ResolvedPlugin[]): Promise<{
    resolved: ResolvedPlugin[]
    missing: PluginId[]
    circular: PluginId[]
  }> {
    const pluginMap = new Map(plugins.map((p) => [p.manifest.id, p]))
    const missing: PluginId[] = []
    const visited = new Set<PluginId>()
    const inStack = new Set<PluginId>()
    const circular: PluginId[] = []

    function checkDeps(id: PluginId): void {
      if (inStack.has(id)) {
        circular.push(id)
        return
      }
      if (visited.has(id)) return

      inStack.add(id)
      const plugin = pluginMap.get(id)
      if (!plugin) {
        missing.push(id)
        inStack.delete(id)
        return
      }

      const deps = [
        ...(plugin.manifest.dependencies ?? []),
        ...(plugin.manifest.optionalDependencies ?? []),
      ]

      for (const dep of deps) {
        if (!pluginMap.has(dep)) {
          if (!plugin.manifest.optionalDependencies?.includes(dep)) {
            missing.push(dep)
          }
        } else {
          checkDeps(dep)
        }
      }

      inStack.delete(id)
      visited.add(id)
    }

    for (const plugin of plugins) {
      checkDeps(plugin.manifest.id)
    }

    return { resolved: plugins.filter((p) => !missing.includes(p.manifest.id)), missing, circular }
  }

  private async findManifest(dir: string): Promise<PluginManifest | null> {
    for (const file of MANIFEST_FILES) {
      const manifestPath = join(dir, file)
      if (!existsSync(manifestPath)) continue

      try {
        const { readFile } = await import('fs/promises')
        const content = await readFile(manifestPath, 'utf-8')
        const data = JSON.parse(content)

        if (file === 'package.json') {
          return {
            id: data.name ?? dir.split('/').pop()!,
            name: data.name ?? 'Unknown Plugin',
            version: data.version ?? '0.0.0',
            description: data.description ?? '',
            entryPoint: data.main ?? 'index',
            ...data.opensin,
          }
        }

        return {
          id: data.id ?? dir.split('/').pop()!,
          name: data.name ?? 'Unknown Plugin',
          version: data.version ?? '0.0.0',
          description: data.description ?? '',
          entryPoint: data.entryPoint ?? 'index',
          ...data,
        }
      } catch {
        continue
      }
    }

    return null
  }
}

export function createPluginLoader(): OpenSINPluginLoader {
  return new OpenSINPluginLoader()
}
