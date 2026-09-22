import { describe, it, expect } from 'vitest';
import { withManagerPin, MANAGER_PIN_HEADER } from './managerPin';

describe('withManagerPin', () => {
  it('đặt mã PIN vào đúng header mà backend đọc', () => {
    const config = withManagerPin('246810');

    expect(config.headers[MANAGER_PIN_HEADER]).toBe('246810');
  });

  it('không đưa mã PIN vào query string', () => {
    const config = withManagerPin('246810');

    expect(JSON.stringify(config)).not.toContain('params');
  });
});
