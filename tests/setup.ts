import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock XLSX library
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

// Mock File and FileReader
global.FileReader = class {
  result: string | null = null;
  error: any = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  readAsDataURL = vi.fn(() => {
    this.onload && this.onload({ target: { result: 'data:image/png;base64,mock' } });
  });

  readAsBinaryString = vi.fn(() => {
    this.onload && this.onload({ target: { result: 'mock binary string' } });
  });
} as any;

global.File = class {
  constructor(public name: string, public type: string) {}
} as any;

// Mock navigator.clipboard before any test runs
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
  configurable: true,
});