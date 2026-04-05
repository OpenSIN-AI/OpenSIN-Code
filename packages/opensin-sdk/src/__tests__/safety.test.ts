import { describe, it, expect } from 'vitest'
import { createSafetyDetector } from '../safety/detector.js'

describe('SafetyDetector', () => {
  const d = createSafetyDetector()

  it('should allow safe commands', () => { const r = d.check('ls -la'); expect(r.isDestructive).toBe(false); expect(r.risk).toBe('none') })
  it('should detect rm -rf', () => { const r = d.check('rm -rf /'); expect(r.isDestructive).toBe(true); expect(r.risk).toBe('critical'); expect(r.suggestions!.length).toBeGreaterThan(0) })
  it('should detect sed -i', () => { expect(d.check('sed -i "s/a/b/g" f').isDestructive).toBe(true) })
  it('should detect git reset', () => { expect(d.check('git reset --hard HEAD').isDestructive).toBe(true) })
  it('should detect mkfs', () => { expect(d.check('mkfs.ext4 /dev/sda1').risk).toBe('critical') })
  it('should detect chmod 777', () => { expect(d.check('chmod 777 /tmp').risk).toBe('high') })
  it('should detect sudo', () => { expect(d.check('sudo apt update').risk).toBe('medium') })
  it('should handle empty', () => { expect(d.check('').isDestructive).toBe(false) })
  it('should detect dd', () => { expect(d.check('dd if=/dev/zero of=/dev/sda').risk).toBe('critical') })
  it('should detect truncate', () => { expect(d.check('truncate -s 0 f').risk).toBe('high') })
})
