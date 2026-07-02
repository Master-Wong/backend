import { describe, expect, it } from 'vitest';
import { validateDonationPayload } from './donationValidator.js';

function futureExpiry(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

const basePayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  amount: 1000,
  isAnonymous: false,
};

describe('validateDonationPayload', () => {
  it('accepts a valid M-Pesa donation', () => {
    const result = validateDonationPayload({
      ...basePayload,
      paymentMethod: 'mpesa',
      phoneNumber: '0712345678',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.paymentMethod).toBe('mpesa');
      expect(result.data.phoneNumber).toBe('254712345678');
    }
  });

  it('accepts a valid card donation', () => {
    const result = validateDonationPayload({
      ...basePayload,
      paymentMethod: 'card',
      cardNumber: '4111 1111 1111 1111',
      nameOnCard: 'Jane Doe',
      expiry: futureExpiry(),
      cvc: '123',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.paymentMethod).toBe('card');
      expect(result.data.cardNumber).toBe('4111111111111111');
    }
  });

  it('rejects missing required fields', () => {
    const result = validateDonationPayload({});

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.details).toContain('Name is required');
      expect(result.details).toContain('Email is required');
      expect(result.details).toContain('Amount is required');
    }
  });

  it('rejects an invalid M-Pesa phone number', () => {
    const result = validateDonationPayload({
      ...basePayload,
      paymentMethod: 'mpesa',
      phoneNumber: '12345',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.details).toContain('Phone number format is invalid');
    }
  });

  it('rejects an invalid payment method', () => {
    const result = validateDonationPayload({
      ...basePayload,
      paymentMethod: 'paypal',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.details).toContain('Payment method must be mpesa or card');
    }
  });
});
