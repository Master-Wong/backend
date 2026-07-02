import { validateDonationPayload } from '../validators/donationValidator.js';
import { processPayment } from '../services/paymentSimulator.services.js';
import { saveDonation } from '../store/donationStore.store.js';

function maskCardNumber(cardNumber) {
  const digits = cardNumber.replace(/\s/g, '');
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

function buildStoredRecord(donation, transactionId) {
  const record = {
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

export const sendDonations = async (req, res) => {
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
