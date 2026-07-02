import type { StoredDonation, StoredDonationInput } from '../types/donation.types.js';

const donations = new Map<string, StoredDonation>();

function saveDonation(donation: StoredDonationInput): StoredDonation {
  const record: StoredDonation = {
    ...donation,
    createdAt: new Date().toISOString(),
  };

  donations.set(record.transactionId, record);
  return record;
}

function getDonationCount(): number {
  return donations.size;
}

function getDonation(transactionId: string): StoredDonation | null {
  return donations.get(transactionId) ?? null;
}

export {
  saveDonation,
  getDonationCount,
  getDonation,
};
