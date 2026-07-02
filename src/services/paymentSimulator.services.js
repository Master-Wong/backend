import { randomUUID } from 'node:crypto';

const PAYMENT_SUCCESS_DELAY_MS = 800;
const PAYMENT_FAILURE_DELAY_MS = 5000;
const MPESA_SUCCESS_RATE = 0.9;
const CARD_SUCCESS_RATE = 0.85;
const TRIGGER_AMOUNT_SUCCESS = 1000;
const TRIGGER_AMOUNT_FAILURE = 1001;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveSimulationOutcome({ amount, successRate }) {
  if (amount === TRIGGER_AMOUNT_SUCCESS) {
    return true;
  }

  if (amount === TRIGGER_AMOUNT_FAILURE) {
    return false;
  }

  return Math.random() < successRate;
}

function buildFailureResult(paymentMethod) {
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

function buildSuccessResult(paymentMethod) {
  const prefix = paymentMethod === 'mpesa' ? 'MPESA' : 'CARD';

  return {
    success: true,
    transactionId: `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`,
  };
}

async function processPayment({ paymentMethod, amount }) {
  const successRate = paymentMethod === 'mpesa' ? MPESA_SUCCESS_RATE : CARD_SUCCESS_RATE;
  const success = resolveSimulationOutcome({ amount, successRate });

  await delay(success ? PAYMENT_SUCCESS_DELAY_MS : PAYMENT_FAILURE_DELAY_MS);

  if (!success) {
    return buildFailureResult(paymentMethod);
  }

  return buildSuccessResult(paymentMethod);
}

export {
  processPayment,
  TRIGGER_AMOUNT_SUCCESS,
  TRIGGER_AMOUNT_FAILURE,
};
