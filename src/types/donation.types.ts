export type PaymentMethod = 'mpesa' | 'card';

export interface DonationRequestBody {
  name?: unknown;
  email?: unknown;
  amount?: unknown;
  paymentMethod?: unknown;
  isAnonymous?: unknown;
  phoneNumber?: unknown;
  cardNumber?: unknown;
  nameOnCard?: unknown;
  expiry?: unknown;
  cvc?: unknown;
}

export interface DonationBase {
  name: string;
  email: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
}

export interface MpesaDonation extends DonationBase {
  paymentMethod: 'mpesa';
  phoneNumber: string;
}

export interface CardDonation extends DonationBase {
  paymentMethod: 'card';
  cardNumber: string;
  nameOnCard: string;
  expiry: string;
  cvc: string;
}

export type ValidatedDonation = MpesaDonation | CardDonation;

export type ValidationResult =
  | { valid: false; details: string[] }
  | { valid: true; data: ValidatedDonation };

export interface StoredDonationInput {
  transactionId: string;
  status: 'completed';
  name: string;
  email: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  phoneNumber?: string;
  nameOnCard?: string;
  cardNumber?: string;
}

export interface StoredDonation extends StoredDonationInput {
  createdAt: string;
}

export interface DonationReceiptResponse {
  transactionId: string;
  status: string;
  donorName: string;
  email: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  createdAt: string;
}

export type PaymentSuccessResult = {
  success: true;
  transactionId: string;
};

export type PaymentFailureResult = {
  success: false;
  message: string;
};

export type PaymentResult = PaymentSuccessResult | PaymentFailureResult;
