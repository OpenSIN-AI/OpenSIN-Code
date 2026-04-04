import { describe, it, expect } from 'vitest';
import { isPathSafe, validateFileReadable, validateDirectoryWritable, isCommandSafe, validateFileSize } from '../security.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-security-'));

describe('isPathSafe', () => {
  it('allows normal paths', () => {
    expect(isPathSafe('/tmp/test.txt').allowed).toBe(true);
  });

  it('blocks path traversal to /etc', () => {
    const result = isPathSafe('../../../etc/shadow');
    expect(result.allowed).toBe(false);
  });

  it('blocks denied directories', () => {
    const result = isPathSafe('/etc/shadow');
    expect(result.allowed).toBe(false);
  });
});

describe('validateFileReadable', () => {
  it('returns true for existing files', () => {
    const filePath = path.join(testDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello');
    expect(validateFileReadable(filePath).allowed).toBe(true);
  });

  it('returns false for non-existent files', () => {
    const result = validateFileReadable('/nonexistent/file.txt');
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(404);
  });
});

describe('validateDirectoryWritable', () => {
  it('returns true for existing directories', () => {
    expect(validateDirectoryWritable(testDir).allowed).toBe(true);
  });

  it('returns true for non-existent directories (will be created)', () => {
    expect(validateDirectoryWritable(path.join(testDir, 'new-dir')).allowed).toBe(true);
  });
});

describe('isCommandSafe', () => {
  it('allows normal commands', () => {
    expect(isCommandSafe('ls -la').allowed).toBe(true);
  });

  it('blocks dangerous commands', () => {
    expect(isCommandSafe('rm -rf /').allowed).toBe(false);
  });

  it('blocks fork bombs', () => {
    expect(isCommandSafe(':(){:|:&};:').allowed).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('allows small files', () => {
    const filePath = path.join(testDir, 'small.txt');
    fs.writeFileSync(filePath, 'small');
    expect(validateFileSize(filePath, 1024).allowed).toBe(true);
  });

  it('blocks large files', () => {
    const filePath = path.join(testDir, 'large.txt');
    fs.writeFileSync(filePath, 'x'.repeat(2000));
    expect(validateFileSize(filePath, 1000).allowed).toBe(false);
  });
});
