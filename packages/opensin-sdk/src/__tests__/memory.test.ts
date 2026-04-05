import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createFileProvider } from '../memory/provider.js'
import { createMemoryManager } from '../memory/manager.js'
import { rm } from 'fs/promises'

const TEST_DIR = '/tmp/opensin-memory-test'

describe('MemoryManager', () => {
  let manager: ReturnType<typeof createMemoryManager>

  beforeEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }); manager = createMemoryManager(createFileProvider(TEST_DIR)) })
  afterEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }) })

  it('should add and retrieve', async () => {
    const entry = await manager.add('Test memory', ['test'])
    expect(entry.content).toBe('Test memory')
    const loaded = await manager.get(entry.id)
    expect(loaded!.content).toBe('Test memory')
  })

  it('should search', async () => {
    await manager.add('Python tutorial', ['python'])
    await manager.add('JavaScript async', ['javascript'])
    const results = await manager.search('Python')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('should list by tags', async () => {
    await manager.add('Py1', ['python'])
    await manager.add('JS1', ['javascript'])
    expect((await manager.list(['python'])).length).toBe(1)
  })

  it('should delete', async () => {
    const entry = await manager.add('Delete me')
    expect(await manager.delete(entry.id)).toBe(true)
    expect(await manager.get(entry.id)).toBeNull()
  })

  it('should update', async () => {
    const entry = await manager.add('Original')
    const updated = await manager.update(entry.id, 'New')
    expect(updated!.content).toBe('New')
  })

  it('should track access count', async () => {
    const entry = await manager.add('Test')
    await manager.get(entry.id)
    await manager.get(entry.id)
    expect((await manager.get(entry.id))!.accessCount).toBe(3)
  })
})
