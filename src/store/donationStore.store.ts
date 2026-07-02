import type {
  DonationStatus,
  StoredDonation,
  StoredDonationInput,
} from '../types/donation.types.js';

const donations = new Map<string, StoredDonation>();

function createDonation(donation: StoredDonationInput): StoredDonation {
  // Persist a new donation with created/updated timestamps.
  const now = new Date().toISOString();
  const record: StoredDonation = {
    ...donation,
    createdAt: now,
    updatedAt: now,
  };

  donations.set(record.transactionId, record);
  return record;
}

function updateDonationStatus(
  transactionId: string,
  status: DonationStatus,
  extras: Partial<StoredDonationInput> = {},
): StoredDonation | null {
  // Update status and optional fields for an existing donation.
  const existing = donations.get(transactionId);

  if (!existing) {
    return null;
  }

  const updated: StoredDonation = {
    ...existing,
    ...extras,
    status,
    updatedAt: new Date().toISOString(),
  };

  donations.set(transactionId, updated);
  return updated;
}

function getDonationCount(): number {
  // Return total donations stored in memory.
  return donations.size;
}

function getDonation(transactionId: string): StoredDonation | null {
  // Look up a donation by transaction id.
  return donations.get(transactionId) ?? null;
}

export {
  createDonation,
  updateDonationStatus,
  getDonationCount,
  getDonation,
};
