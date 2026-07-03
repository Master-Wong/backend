import { randomUUID } from 'node:crypto';
import { appConfig } from '../config/app.config.js';
import { updateDonationStatus } from '../store/donationStore.store.js';
import type { MpesaDonation, ValidatedDonation } from '../types/donation.types.js';
import type { MpesaProvider } from './paymentProvider.types.js';
import { delay, isFailureAmount, SIMULATED_FAILURE_MESSAGE } from './shared.js';

async function simulateCallback(
  donationId: string,
  amount: number,
): Promise<void> {
  // Runs in the background after 202 — updates the donation record the client is polling.
  // Simulate M-Pesa STK callback success or failure after a delay.
  const willFail = isFailureAmount(amount);
  await delay(willFail ? appConfig.mpesaFailureDelayMs : appConfig.mpesaCallbackDelayMs);

  if (willFail) {
    updateDonationStatus(donationId, 'failed', {
      failureMessage: SIMULATED_FAILURE_MESSAGE,
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
