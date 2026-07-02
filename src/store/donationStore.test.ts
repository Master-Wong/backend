import { describe, expect, it } from 'vitest';
import {
  createDonation,
  getDonation,
  updateDonationStatus,
} from './donationStore.store.js';

describe('donationStore', () => {
  it('creates and retrieves a donation record', () => {
    const record = createDonation({
      transactionId: 'MPESA-TEST-001',
      status: 'pending',
      name: 'Jane Doe',
      email: 'jane@example.com',
      amount: 1000,
      paymentMethod: 'mpesa',
      isAnonymous: false,
      phoneNumber: '254712345678',
    });

    expect(record.status).toBe('pending');
    expect(record.createdAt).toBeTruthy();
    expect(getDonation('MPESA-TEST-001')).toEqual(record);
  });

  it('updates donation status and timestamps', () => {
    createDonation({
      transactionId: 'MPESA-TEST-002',
      status: 'pending',
      name: 'Jane Doe',
      email: 'jane@example.com',
      amount: 1000,
      paymentMethod: 'mpesa',
      isAnonymous: false,
      phoneNumber: '254712345678',
    });

    const updated = updateDonationStatus('MPESA-TEST-002', 'completed');

    expect(updated?.status).toBe('completed');
    expect(updated?.updatedAt).toBeTruthy();
  });

  it('returns null when updating a missing donation', () => {
    expect(updateDonationStatus('MISSING-ID', 'failed')).toBeNull();
  });
});
