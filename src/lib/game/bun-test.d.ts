// Minimal types for Bun's built-in test runner (avoids adding @types/bun).
declare module "bun:test" {
  export const mock: { module(path: string, factory: () => unknown): void };
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(value: unknown): {
    toBe(expected: unknown): void;
  };
}
