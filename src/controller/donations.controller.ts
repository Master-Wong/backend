import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { getCardProvider, getMpesaProvider } from '../providers/index.js';
import { saveIdempotentResponse } from '../store/idempotencyStore.store.js';
import { createDonation, getDonation } from '../store/donationStore.store.js';
import type {
  DonationCreateResponse,
  DonationStatusResponse,
  StoredDonationInput,
  ValidatedDonation,
} from '../types/donation.types.js';
import { validateDonationPayload } from '../validators/donationValidator.js';

function maskCardNumber(cardNumber: string): string {
  // Mask all but the last four card digits for storage.
  const digits = cardNumber.replace(/\s/g, '');
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

function generateTransactionId(paymentMethod: ValidatedDonation['paymentMethod']): string {
  // Build a prefixed transaction id for the payment method.
  const prefix = paymentMethod === 'mpesa' ? 'MPESA' : 'CARD';
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildStoredRecord(
  donation: ValidatedDonation,
  transactionId: string,
  status: StoredDonationInput['status'],
): StoredDonationInput {
  // Map validated input to a storable donation record.
  const record: StoredDonationInput = {
    transactionId,
    status,
    name: donation.isAnonymous ? 'Anonymous' : donation.name,
    email: donation.email,
    amount: donation.amount,
    paymentMethod: donation.paymentMethod,
    isAnonymous: donation.isAnonymous,
  };

  if (donation.paymentMethod === 'mpesa') {
    record.phoneNumber = donation.phoneNumber;
  }

  if (donation.paymentMethod === 'card') {
    record.nameOnCard = donation.nameOnCard;
    record.cardNumber = maskCardNumber(donation.cardNumber);
  }

  return record;
}

function formatStatusResponse(donation: NonNullable<ReturnType<typeof getDonation>>): DonationStatusResponse {
  // Shape stored donation data for GET status responses.
  const response: DonationStatusResponse = {
    transactionId: donation.transactionId,
    status: donation.status,
    amount: donation.amount,
    paymentMethod: donation.paymentMethod,
    isAnonymous: donation.isAnonymous,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
  };

  if (donation.status === 'completed') {
    response.donorName = donation.name;
    response.email = donation.email;
    response.message = 'Donation received successfully.';
  }

  if (donation.status === 'pending') {
    response.message = 'STK push sent. Confirm on your phone.';
  }

  if (donation.status === 'failed') {
    response.failureMessage = donation.failureMessage;
  }

  return response;
}

function cacheAndSend(
  req: Request,
  res: Response,
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  // Persist idempotent response then send JSON to the client.
  if (req.idempotencyKey && req.idempotencyBodyHash) {
    saveIdempotentResponse(
      req.idempotencyKey,
      req.idempotencyBodyHash,
      statusCode,
      body,
      extraHeaders,
    );
  }

  if (extraHeaders) {
    for (const [header, value] of Object.entries(extraHeaders)) {
      res.setHeader(header, value);
    }
  }

  return res.status(statusCode).json(body);
}

export const sendDonations = async (req: Request, res: Response): Promise<Response> => {
  // Validate input, initiate payment, and return async or sync result.
  const validation = validateDonationPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.details,
    });
  }

  const donation = validation.data;
  const transactionId = generateTransactionId(donation.paymentMethod);

  if (donation.paymentMethod === 'mpesa') {
    createDonation(buildStoredRecord(donation, transactionId, 'pending'));
    await getMpesaProvider().initiateStkPush(donation, transactionId);

    const body: DonationCreateResponse = {
      transactionId,
      status: 'pending',
      message: 'STK push sent. Confirm on your phone.',
      amount: donation.amount,
      paymentMethod: donation.paymentMethod,
      isAnonymous: donation.isAnonymous,
    };

    return cacheAndSend(req, res, 202, body, {
      Location: `/api/donations/${transactionId}`,
    });
  }

  const chargeResult = await getCardProvider().charge(donation);

  if (!chargeResult.success) {
    return cacheAndSend(req, res, 402, {
      error: 'Payment failed',
      message: chargeResult.message,
    });
  }

  const savedDonation = createDonation(
    buildStoredRecord(donation, transactionId, 'completed'),
  );

  const body: DonationCreateResponse = {
    transactionId: savedDonation.transactionId,
    status: savedDonation.status,
    message: 'Donation received successfully.',
    amount: savedDonation.amount,
    paymentMethod: savedDonation.paymentMethod,
    isAnonymous: savedDonation.isAnonymous,
  };

  return cacheAndSend(req, res, 201, body, {
    Location: `/api/donations/${savedDonation.transactionId}`,
  });
};

export const getDonationById = (req: Request, res: Response): Response => {
  // Return donation status or 404 when not found.
  const { transactionId } = req.params;
  const id = Array.isArray(transactionId) ? transactionId[0] : transactionId;
  const donation = getDonation(id);

  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  return res.status(200).json(formatStatusResponse(donation));
};
