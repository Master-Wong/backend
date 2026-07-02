import { randomUUID } from 'node:crypto';
import { appConfig } from '../config/app.config.js';
import { updateDonationStatus } from '../store/donationStore.store.js';
import type { MpesaDonation, ValidatedDonation } from '../types/donation.types.js';
import type { MpesaProvider } from './paymentProvider.types.js';
import { delay, isFailureAmount } from './shared.js';

async function simulateCallback(
  donationId: string,
  amount: number,
): Promise<void> {
  // Simulate M-Pesa STK callback success or failure after a delay.
  const willFail = isFailureAmount(amount);
  await delay(willFail ? appConfig.mpesaFailureDelayMs : appConfig.mpesaCallbackDelayMs);

  if (willFail) {
    updateDonationStatus(donationId, 'failed', {
      failureMessage: 'M-Pesa STK push was declined or timed out. Please try again.',
    });
    return;
  }

  updateDonationStatus(donationId, 'completed');
}

export const mpesaProvider: MpesaProvider = {
  method: 'mpesa',

  async initiateStkPush(donation: ValidatedDonation, donationId: string): Promise<void> {
    // Send STK push and schedule simulated callback processing.
    const mpesaDonation = donation as MpesaDonation;
    const checkoutRequestId = `ws_CO_${randomUUID().slice(0, 12)}`;

    updateDonationStatus(donationId, 'pending', { checkoutRequestId });

    void simulateCallback(donationId, mpesaDonation.amount);
  },
};
