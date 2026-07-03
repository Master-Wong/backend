import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cardProvider } from './card.provider.js';
import { SIMULATED_FAILURE_MESSAGE } from './shared.js';

describe('cardProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns success for amounts that do not end in 1', async () => {
    const promise = cardProvider.charge({
      name: 'Jane Doe',
      email: 'jane@example.com',
      amount: 1000,
      paymentMethod: 'card',
      isAnonymous: false,
      cardNumber: '4111111111111111',
      nameOnCard: 'Jane Doe',
      expiry: '12/30',
      cvc: '123',
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it('returns failure for amounts ending in 1', async () => {
    const promise = cardProvider.charge({
      name: 'Jane Doe',
      email: 'jane@example.com',
      amount: 1001,
      paymentMethod: 'card',
      isAnonymous: false,
      cardNumber: '4111111111111111',
      nameOnCard: 'Jane Doe',
      expiry: '12/30',
      cvc: '123',
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.message).toBe(SIMULATED_FAILURE_MESSAGE);
  });
});
