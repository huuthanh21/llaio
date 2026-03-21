import '@testing-library/jest-dom/vitest';

class LocalStorageMock {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class ClassListMock {
  private classes: Set<string> = new Set();

  add(cls: string): void {
    this.classes.add(cls);
  }

  remove(cls: string): void {
    this.classes.delete(cls);
  }

  contains(cls: string): boolean {
    return this.classes.has(cls);
  }

  toggle(cls: string): boolean {
    if (this.classes.has(cls)) {
      this.classes.delete(cls);
      return false;
    }
    this.classes.add(cls);
    return true;
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
});

if (typeof document === 'undefined') {
  const htmlElement = { classList: new ClassListMock() };
  (globalThis as Record<string, unknown>)['document'] = {
    documentElement: htmlElement,
  };
}

if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>)['window'] = globalThis;
}

const mockMatchMedia = (_query: string) => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

if (typeof globalThis.matchMedia !== 'function') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
}
