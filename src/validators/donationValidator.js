const VALID_PAYMENT_METHODS = ['mpesa', 'card'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const CVC_REGEX = /^\d{3,4}$/;

function normalizePhoneNumber(phone) {
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith('7')) {
    digits = `254${digits}`;
  }

  return digits;
}

function isValidKenyanPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  return /^2547\d{8}$/.test(normalized);
}

function isValidExpiry(expiry) {
  const match = EXPIRY_REGEX.exec(expiry.trim());

  if (!match) {
    return false;
  }

  const month = Number.parseInt(match[1], 10);
  const year = 2000 + Number.parseInt(match[2], 10);
  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const now = new Date();

  return expiryEnd >= now;
}

function validateMpesaFields(body, details) {
  const { phoneNumber } = body;

  if (phoneNumber === undefined || phoneNumber === null || phoneNumber === '') {
    details.push('Phone number is required for M-Pesa payments');
    return null;
  }

  if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    details.push('Phone number is required for M-Pesa payments');
    return null;
  }

  if (!isValidKenyanPhone(phoneNumber)) {
    details.push('Phone number format is invalid');
    return null;
  }

  return normalizePhoneNumber(phoneNumber.trim());
}

function validateCardFields(body, details) {
  const { cardNumber, nameOnCard, expiry, cvc } = body;
  const result = {};
  let valid = true;

  if (cardNumber === undefined || cardNumber === null || cardNumber === '') {
    details.push('Card number is required for card payments');
    valid = false;
  } else if (typeof cardNumber !== 'string') {
    details.push('Card number must be a valid string');
    valid = false;
  } else {
    const digits = cardNumber.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(digits)) {
      details.push('Card number must be 13 to 19 digits');
      valid = false;
    } else {
      result.cardNumber = digits;
    }
  }

  if (nameOnCard === undefined || nameOnCard === null || nameOnCard === '') {
    details.push('Name on card is required for card payments');
    valid = false;
  } else if (typeof nameOnCard !== 'string' || nameOnCard.trim().length < 2) {
    details.push('Name on card must be at least 2 characters');
    valid = false;
  } else {
    result.nameOnCard = nameOnCard.trim();
  }

  if (expiry === undefined || expiry === null || expiry === '') {
    details.push('Expiry is required for card payments');
    valid = false;
  } else if (typeof expiry !== 'string' || !isValidExpiry(expiry)) {
    details.push('Expiry must be a valid MM/YY date that is not in the past');
    valid = false;
  } else {
    result.expiry = expiry.trim();
  }

  if (cvc === undefined || cvc === null || cvc === '') {
    details.push('CVC is required for card payments');
    valid = false;
  } else if (typeof cvc !== 'string' || !CVC_REGEX.test(cvc.trim())) {
    details.push('CVC must be 3 or 4 digits');
    valid = false;
  } else {
    result.cvc = cvc.trim();
  }

  return valid ? result : null;
}

function validateDonationPayload(body) {
  const details = [];
  const {
    name,
    email,
    amount,
    paymentMethod,
    isAnonymous,
    phoneNumber,
    cardNumber,
    nameOnCard,
    expiry,
    cvc,
  } = body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    details.push('Name is required');
  } else if (name.trim().length < 2) {
    details.push('Name must be at least 2 characters');
  }

  if (typeof email !== 'string' || !email.trim()) {
    details.push('Email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    details.push('Email format is invalid');
  }

  if (amount === undefined || amount === null || amount === '') {
    details.push('Amount is required');
  } else if (typeof amount !== 'number' || Number.isNaN(amount)) {
    details.push('Amount must be a valid number');
  } else if (amount <= 0) {
    details.push('Amount must be greater than 0');
  }

  if (paymentMethod === undefined || paymentMethod === null || paymentMethod === '') {
    details.push('Payment method is required');
  } else if (!VALID_PAYMENT_METHODS.includes(String(paymentMethod).toLowerCase())) {
    details.push('Payment method must be mpesa or card');
  }

  let anonymous = false;

  if (isAnonymous !== undefined && isAnonymous !== null && isAnonymous !== '') {
    if (typeof isAnonymous !== 'boolean') {
      details.push('isAnonymous must be a boolean');
    } else {
      anonymous = isAnonymous;
    }
  }

  if (details.length > 0) {
    return { valid: false, details };
  }

  const method = String(paymentMethod).toLowerCase();
  const data = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    amount: Number(amount),
    paymentMethod: method,
    isAnonymous: anonymous,
  };

  if (method === 'mpesa') {
    const normalizedPhone = validateMpesaFields({ phoneNumber }, details);

    if (details.length > 0) {
      return { valid: false, details };
    }

    data.phoneNumber = normalizedPhone;
  }

  if (method === 'card') {
    const cardData = validateCardFields(
      { cardNumber, nameOnCard, expiry, cvc },
      details,
    );

    if (!cardData) {
      return { valid: false, details };
    }

    Object.assign(data, cardData);
  }

  return {
    valid: true,
    data,
  };
}

export {
  validateDonationPayload,
  VALID_PAYMENT_METHODS,
};
