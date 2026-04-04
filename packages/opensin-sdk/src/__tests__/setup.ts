import { vi } from 'vitest';

Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: vi.fn(), readText: vi.fn() } },
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: { createElement: vi.fn(), querySelector: vi.fn() },
  writable: true,
  configurable: true,
});

vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
