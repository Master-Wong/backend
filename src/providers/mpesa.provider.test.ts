import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDonation, getDonation } from '../store/donationStore.store.js';
import { mpesaProvider } from './mpesa.provider.js';

function seedDonation(transactionId: string, amount: number) {
  createDonation({
    transactionId,
    status: 'pending',
    name: 'Jane Doe',
    email: 'jane@example.com',
    amount,
    paymentMethod: 'mpesa',
    isAnonymous: false,
    phoneNumber: '254712345678',
  });
}

describe('mpesaProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks successful STK callbacks as completed', async () => {
    const donationId = `MPESA-PROVIDER-${Date.now()}`;
    seedDonation(donationId, 1000);

    await mpesaProvider.initiateStkPush(
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        amount: 1000,
        paymentMethod: 'mpesa',
        isAnonymous: false,
        phoneNumber: '254712345678',
      },
      donationId,
    );

    expect(getDonation(donationId)?.status).toBe('pending');

    await vi.runAllTimersAsync();

    expect(getDonation(donationId)?.status).toBe('completed');
  });

  it('marks failed STK callbacks as failed', async () => {
    const donationId = `MPESA-FAIL-${Date.now()}`;
    seedDonation(donationId, 1001);

    await mpesaProvider.initiateStkPush(
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        amount: 1001,
        paymentMethod: 'mpesa',
        isAnonymous: false,
        phoneNumber: '254712345678',
      },
      donationId,
    );

    await vi.runAllTimersAsync();

    const donation = getDonation(donationId);
    expect(donation?.status).toBe('failed');
    expect(donation?.failureMessage).toBeTruthy();
  });
});
