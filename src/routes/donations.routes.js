import express from 'express';
import { getDonationById, sendDonations } from '../controller/donations.controller.js';

const router = express.Router();

router.post('/', sendDonations);
router.get('/:transactionId', getDonationById);

export default router;
