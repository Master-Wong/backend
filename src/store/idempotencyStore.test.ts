import { describe, expect, it } from 'vitest';
import {
  getIdempotentResponse,
  hashRequestBody,
  saveIdempotentResponse,
} from './idempotencyStore.store.js';

describe('idempotencyStore', () => {
  it('hashes request bodies consistently', () => {
    const body = { amount: 1000, paymentMethod: 'mpesa' };
    expect(hashRequestBody(body)).toBe(hashRequestBody(body));
  });

  it('stores and replays cached responses', () => {
    const key = `test-key-${Date.now()}`;
    const hash = hashRequestBody({ amount: 500 });

    saveIdempotentResponse(key, hash, 202, { status: 'pending' }, { Location: '/api/donations/abc' });

    const cached = getIdempotentResponse(key);

    expect(cached?.statusCode).toBe(202);
    expect(cached?.body).toEqual({ status: 'pending' });
    expect(cached?.headers?.Location).toBe('/api/donations/abc');
  });

  it('produces different hashes for different bodies', () => {
    expect(hashRequestBody({ amount: 1000 })).not.toBe(hashRequestBody({ amount: 1001 }));
  });
});
