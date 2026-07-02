import { randomUUID } from 'node:crypto';
import type { PaymentMethod, PaymentResult } from '../types/donation.types.js';

const PAYMENT_SUCCESS_DELAY_MS = 800;
const PAYMENT_FAILURE_DELAY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isFailureAmount(amount: number): boolean {
  const normalized = Math.floor(Math.abs(Number(amount)));
  return normalized % 10 === 1;
}

function resolveSimulationOutcome(amount: number): boolean {
  return !isFailureAmount(amount);
}

function buildFailureResult(paymentMethod: PaymentMethod): PaymentResult {
  if (paymentMethod === 'mpesa') {
    return {
      success: false,
      message: 'M-Pesa STK push was declined or timed out. Please try again.',
    };
  }

  return {
    success: false,
    message: 'Card charge was declined. Please check your details or try another method.',
  };
}

function buildSuccessResult(paymentMethod: PaymentMethod): PaymentResult {
  const prefix = paymentMethod === 'mpesa' ? 'MPESA' : 'CARD';

  return {
    success: true,
    transactionId: `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`,
  };
}

async function processPayment({
  paymentMethod,
  amount,
}: {
  paymentMethod: PaymentMethod;
  amount: number;
}): Promise<PaymentResult> {
  const success = resolveSimulationOutcome(amount);

  await delay(success ? PAYMENT_SUCCESS_DELAY_MS : PAYMENT_FAILURE_DELAY_MS);

  if (!success) {
    return buildFailureResult(paymentMethod);
  }

  return buildSuccessResult(paymentMethod);
}

export {
  processPayment,
  isFailureAmount,
};
