import { describe, it, expect } from 'vitest'
import { createParallelExecutor } from '../parallel_tools/executor.js'

describe('ParallelToolExecutor', () => {
  it('should not parallelize single call', () => { expect(createParallelExecutor().shouldParallelize([{ id: '1', name: 'read', input: {} }])).toBe(false) })
  it('should not parallelize never-parallel tools', () => { expect(createParallelExecutor().shouldParallelize([{ id: '1', name: 'clarify', input: {} }, { id: '2', name: 'read', input: {} }])).toBe(false) })
  it('should parallelize read-only tools', () => { expect(createParallelExecutor().shouldParallelize([{ id: '1', name: 'read_file', input: { path: '/a.txt' } }, { id: '2', name: 'read_file', input: { path: '/b.txt' } }])).toBe(true) })
  it('should not parallelize conflicting paths', () => { expect(createParallelExecutor().shouldParallelize([{ id: '1', name: 'write_file', input: { path: '/s.txt' } }, { id: '2', name: 'write_file', input: { path: '/s.txt' } }])).toBe(false) })

  it('should execute sequentially when not parallelizable', async () => {
    const r = await createParallelExecutor().executeParallel([{ id: '1', name: 'x', input: {} }], async (c) => ({ id: c.id, name: c.name, output: `r-${c.id}`, isError: false, duration: 0 }))
    expect(r[0].output).toBe('r-1')
  })

  it('should handle errors', async () => {
    const r = await createParallelExecutor().executeParallel([{ id: '1', name: 'fail', input: {} }], async () => { throw new Error('fail') })
    expect(r[0].isError).toBe(true)
    expect(r[0].output).toBe('fail')
  })
})
