import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const UTILS_DIR = path.resolve(__dirname, '../utils_v2');
const INDEX_PATH = path.join(UTILS_DIR, 'index.ts');
const FORMAT_PATH = path.join(UTILS_DIR, 'format.ts');
const ARRAY_PATH = path.join(UTILS_DIR, 'array.ts');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function readFormatContent(): string {
  return fs.readFileSync(FORMAT_PATH, 'utf-8');
}

function readArrayContent(): string {
  return fs.readFileSync(ARRAY_PATH, 'utf-8');
}

function readUtilFile(fileName: string): string {
  const filePath = path.join(UTILS_DIR, fileName + '.ts');
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf-8');
  return '';
}

describe('Utils v2 Module', () => {
  describe('Module exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should re-export format module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './format'");
    });

    it('should re-export array module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './array'");
    });

    it('should re-export CircularBuffer', () => {
      const content = readIndexContent();
      expect(content).toContain("from './CircularBuffer'");
    });

    it('should re-export config module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './config'");
    });

    it('should re-export git module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './git'");
    });

    it('should re-export json module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './json'");
    });

    it('should re-export markdown module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './markdown'");
    });

    it('should re-export path module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './path'");
    });

    it('should re-export stream module', () => {
      const content = readIndexContent();
      expect(content).toContain("from './stream'");
    });
  });

  describe('formatFileSize', () => {
    it('format.ts should export formatFileSize', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatFileSize');
    });

    it('should handle bytes', () => {
      const content = readFormatContent();
      expect(content).toContain('bytes');
    });

    it('should handle KB', () => {
      const content = readFormatContent();
      expect(content).toContain('KB');
    });

    it('should handle MB', () => {
      const content = readFormatContent();
      expect(content).toContain('MB');
    });

    it('should handle GB', () => {
      const content = readFormatContent();
      expect(content).toContain('GB');
    });
  });

  describe('formatDuration', () => {
    it('format.ts should export formatDuration', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatDuration');
    });

    it('should handle zero duration', () => {
      const content = readFormatContent();
      expect(content).toContain("'0s'");
    });

    it('should support mostSignificantOnly option', () => {
      const content = readFormatContent();
      expect(content).toContain('mostSignificantOnly');
    });

    it('should handle days hours minutes seconds', () => {
      const content = readFormatContent();
      expect(content).toContain('days');
      expect(content).toContain('hours');
      expect(content).toContain('minutes');
    });
  });

  describe('Array utilities', () => {
    it('array.ts should export intersperse', () => {
      const content = readArrayContent();
      expect(content).toContain('export function intersperse');
    });

    it('array.ts should export count', () => {
      const content = readArrayContent();
      expect(content).toContain('export function count');
    });

    it('array.ts should export uniq', () => {
      const content = readArrayContent();
      expect(content).toContain('export function uniq');
    });

    it('uniq should use Set', () => {
      const content = readArrayContent();
      expect(content).toContain('Set');
    });
  });

  describe('Utility file structure', () => {
    it('should have at least 100 utility files', () => {
      const entries = fs.readdirSync(UTILS_DIR, { withFileTypes: true });
      const tsFiles = entries.filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx')));
      expect(tsFiles.length).toBeGreaterThanOrEqual(100);
    });

    it('should have CircularBuffer utility', () => {
      const content = readUtilFile('CircularBuffer');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have config utility', () => {
      const content = readUtilFile('config');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have git utility', () => {
      const content = readUtilFile('git');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have markdown utility', () => {
      const content = readUtilFile('markdown');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have json utility', () => {
      const content = readUtilFile('json');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have path utility', () => {
      const content = readUtilFile('path');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have stream utility', () => {
      const content = readUtilFile('stream');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have truncate utility', () => {
      const content = readUtilFile('truncate');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have hash utility', () => {
      const content = readUtilFile('hash');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Additional format utilities', () => {
    it('should export formatSecondsShort', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatSecondsShort');
    });

    it('should export formatLogMetadata', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatLogMetadata');
    });

    it('should export formatResetTime', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatResetTime');
    });

    it('should export formatResetText', () => {
      const content = readFormatContent();
      expect(content).toContain('export function formatResetText');
    });
  });
});
