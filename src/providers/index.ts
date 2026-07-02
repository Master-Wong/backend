import type { PaymentMethod } from '../types/donation.types.js';
import { cardProvider } from './card.provider.js';
import { mpesaProvider } from './mpesa.provider.js';
import type { CardProvider, MpesaProvider } from './paymentProvider.types.js';

export function getMpesaProvider(): MpesaProvider {
  // Return the configured M-Pesa payment provider.
  return mpesaProvider;
}

export function getCardProvider(): CardProvider {
  // Return the configured card payment provider.
  return cardProvider;
}

export function getProvider(method: PaymentMethod): MpesaProvider | CardProvider {
  // Resolve provider implementation by payment method.
  return method === 'mpesa' ? mpesaProvider : cardProvider;
}
