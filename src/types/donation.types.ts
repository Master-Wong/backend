export type PaymentMethod = 'mpesa' | 'card';
export type DonationStatus = 'pending' | 'completed' | 'failed';

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
  status: DonationStatus;
  name: string;
  email: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  phoneNumber?: string;
  nameOnCard?: string;
  cardNumber?: string;
  checkoutRequestId?: string;
  failureMessage?: string;
}

export interface StoredDonation extends StoredDonationInput {
  createdAt: string;
  updatedAt: string;
}

export interface DonationStatusResponse {
  transactionId: string;
  status: DonationStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  message?: string;
  failureMessage?: string;
  donorName?: string;
  email?: string;
}

export interface DonationCreateResponse {
  transactionId: string;
  status: DonationStatus;
  message: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
}

export type CardChargeResult =
  | { success: true }
  | { success: false; message: string };

export interface IdempotentCachedResponse {
  statusCode: number;
  body: unknown;
  headers?: Record<string, string>;
  requestHash: string;
  expiresAt: number;
}

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
      idempotencyBodyHash?: string;
    }
  }
}
