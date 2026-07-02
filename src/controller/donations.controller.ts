import type { Request, Response } from 'express';
import { validateDonationPayload } from '../validators/donationValidator.js';
import { processPayment } from '../services/paymentSimulator.services.js';
import { getDonation, saveDonation } from '../store/donationStore.store.js';
import type {
  DonationReceiptResponse,
  StoredDonationInput,
  ValidatedDonation,
} from '../types/donation.types.js';

function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '');
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

function buildStoredRecord(
  donation: ValidatedDonation,
  transactionId: string,
): StoredDonationInput {
  const record: StoredDonationInput = {
    transactionId,
    status: 'completed',
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

function formatReceiptResponse(donation: {
  transactionId: string;
  status: string;
  name: string;
  email: string;
  amount: number;
  paymentMethod: ValidatedDonation['paymentMethod'];
  isAnonymous: boolean;
  createdAt: string;
}): DonationReceiptResponse {
  return {
    transactionId: donation.transactionId,
    status: donation.status,
    donorName: donation.name,
    email: donation.email,
    amount: donation.amount,
    paymentMethod: donation.paymentMethod,
    isAnonymous: donation.isAnonymous,
    createdAt: donation.createdAt,
  };
}

export const sendDonations = async (req: Request, res: Response): Promise<Response> => {
  const validation = validateDonationPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.details,
    });
  }

  const donation = validation.data;
  const paymentResult = await processPayment(donation);

  if (!paymentResult.success) {
    return res.status(402).json({
      error: 'Payment failed',
      message: paymentResult.message,
    });
  }

  const savedDonation = saveDonation(
    buildStoredRecord(donation, paymentResult.transactionId),
  );

  return res.status(201).json({
    transactionId: savedDonation.transactionId,
    status: savedDonation.status,
    message: 'Donation received successfully.',
    amount: savedDonation.amount,
    paymentMethod: savedDonation.paymentMethod,
    isAnonymous: savedDonation.isAnonymous,
  });
};

export const getDonationById = (req: Request, res: Response): Response => {
  const { transactionId } = req.params;
  const id = Array.isArray(transactionId) ? transactionId[0] : transactionId;
  const donation = getDonation(id);

  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  return res.status(200).json(formatReceiptResponse(donation));
};
