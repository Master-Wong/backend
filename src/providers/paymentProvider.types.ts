import type { CardChargeResult, PaymentMethod, ValidatedDonation } from '../types/donation.types.js';

export interface PaymentProvider {
  readonly method: PaymentMethod;
}

export interface MpesaProvider extends PaymentProvider {
  readonly method: 'mpesa';
  initiateStkPush(donation: ValidatedDonation, donationId: string): Promise<void>;
}

export interface CardProvider extends PaymentProvider {
  readonly method: 'card';
  charge(donation: ValidatedDonation): Promise<CardChargeResult>;
}
