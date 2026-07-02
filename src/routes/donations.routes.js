import express from 'express';
import { sendDonations } from '../controller/donations.controller.js';

const router = express.Router();

router.post('/', sendDonations);

export default router;
