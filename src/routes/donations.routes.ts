import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDonationById, sendDonations } from '../controller/donations.controller.js';
import { appConfig } from '../config/app.config.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';

const router = express.Router();

// The rate limiter is configured with a window of time and a maximum number of requests (max) that can be made within that window.
//  If the limit is exceeded, a custom error message is returned to the client.
const donationRateLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindowMs,
  max: appConfig.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});

router.post('/', donationRateLimiter, idempotencyMiddleware, sendDonations);
router.get('/:transactionId', getDonationById);

export default router;
