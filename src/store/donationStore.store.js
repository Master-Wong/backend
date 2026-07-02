const donations = new Map();

function saveDonation(donation) {
  const record = {
    ...donation,
    createdAt: new Date().toISOString(),
  };

  donations.set(record.transactionId, record);
  return record;
}

function getDonationCount() {
  return donations.size;
}

function getDonation(transactionId) {
  return donations.get(transactionId) ?? null;
}

export {
  saveDonation,
  getDonationCount,
  getDonation,
};
