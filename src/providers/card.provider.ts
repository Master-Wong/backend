import { appConfig } from '../config/app.config.js';
import type { CardChargeResult, ValidatedDonation } from '../types/donation.types.js';
import type { CardProvider } from './paymentProvider.types.js';
import { delay, isFailureAmount } from './shared.js';

export const cardProvider: CardProvider = {
  method: 'card',

  async charge(donation: ValidatedDonation): Promise<CardChargeResult> {
    // Simulate synchronous card authorization success or decline.
    const willFail = isFailureAmount(donation.amount);
    await delay(willFail ? appConfig.cardFailureDelayMs : appConfig.cardSuccessDelayMs);

    if (willFail) {
      return {
        success: false,
        message: 'Card charge was declined. Please check your details or try another method.',
      };
    }

    return { success: true };
  },
};
