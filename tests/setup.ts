/**
 * Test setup — global mocks and utilities
 */
import * as path from 'path';

// Mock file system
jest.mock('fs', () => ({
  readFileSync: jest.fn((p: string) => {
    if (p.endsWith('.local.md')) return '---\nname: test\nenabled: true\nevent: bash\npattern: test\n---\nTest message';
    return '';
  }),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

// Mock glob
jest.mock('glob', () => ({
  sync: jest.fn(() => ['.opensin/hookify/test.local.md']),
}));

// Global test utilities
global.testUtils = {
  createMockInput: (overrides = {}) => ({
    tool_name: 'Bash',
    tool_input: { command: 'echo test' },
    hook_event_name: 'PreToolUse',
    ...overrides,
  }),
};
