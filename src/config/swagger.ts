const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Donations Portal API',
    version: '1.0.0',
    description: 'REST API for processing online donations via M-Pesa or Card.',
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Returns the current status of the API.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/donations': {
      post: {
        summary: 'Submit a donation',
        description:
          'Creates a donation resource and processes payment. ' +
          'M-Pesa is asynchronous: returns 202 with status pending, then resolves via simulated STK callback — poll GET until completed or failed. ' +
          'Card is synchronous: returns 201 on success or 402 on failure. ' +
          'Requires Idempotency-Key header to prevent duplicate charges on retries. ' +
          'Payments fail automatically when the amount ends in 1 (e.g. 1, 11, 501, 1001). ' +
          'When paymentMethod is mpesa, phoneNumber is required. ' +
          'When paymentMethod is card, cardNumber, nameOnCard, expiry, and cvc are all required in the request. ' +
          'For card payments, only nameOnCard and a masked cardNumber are persisted; expiry and cvc are never stored.',
        tags: ['Donations'],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string', format: 'uuid' },
            description: 'Unique key per payment attempt. Replays return the original response.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DonationRequest' },
              examples: {
                mpesa: { $ref: '#/components/examples/MpesaDonationRequest' },
                card: { $ref: '#/components/examples/CardDonationRequest' },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Card donation completed synchronously',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DonationCreateResponse' },
              },
            },
          },
          202: {
            description: 'M-Pesa STK push initiated — donation is pending',
            headers: {
              Location: {
                schema: { type: 'string' },
                description: 'URL to poll for donation status',
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DonationCreateResponse' },
              },
            },
          },
          400: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          402: {
            description: 'Card payment failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentErrorResponse' },
              },
            },
          },
          409: {
            description: 'Idempotency-Key reused with a different request body',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConflictResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RateLimitResponse' },
              },
            },
          },
        },
      },
    },
    '/api/donations/{transactionId}': {
      get: {
        summary: 'Get donation status',
        description:
          'Returns the current donation resource state. Poll this endpoint after a 202 M-Pesa response until status is completed or failed.',
        tags: ['Donations'],
        parameters: [
          {
            name: 'transactionId',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'MPESA-A1B2C3D4' },
          },
        ],
        responses: {
          200: {
            description: 'Donation found (pending, completed, or failed)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DonationStatusResponse' },
              },
            },
          },
          404: {
            description: 'Donation not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Donation not found' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      DonationRequest: {
        type: 'object',
        required: ['name', 'email', 'amount', 'paymentMethod'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          amount: { type: 'number', minimum: 0.01, example: 500 },
          paymentMethod: {
            type: 'string',
            enum: ['mpesa', 'card'],
            example: 'mpesa',
          },
          isAnonymous: {
            type: 'boolean',
            default: false,
            example: false,
          },
          phoneNumber: {
            type: 'string',
            description: 'Required when paymentMethod is mpesa.',
            example: '254700000000',
          },
          cardNumber: {
            type: 'string',
            description: 'Required when paymentMethod is card. Full PAN accepted for validation; only masked value is stored.',
            example: '4111111111111111',
          },
          nameOnCard: {
            type: 'string',
            description: 'Required when paymentMethod is card.',
            example: 'Jane Doe',
          },
          expiry: {
            type: 'string',
            description: 'Required when paymentMethod is card (MM/YY). Not stored after processing.',
            example: '12/28',
          },
          cvc: {
            type: 'string',
            description: 'Required when paymentMethod is card. Not stored after processing.',
            example: '123',
          },
        },
      },
      DonationCreateResponse: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', example: 'MPESA-A1B2C3D4' },
          status: { type: 'string', enum: ['pending', 'completed'], example: 'pending' },
          message: { type: 'string', example: 'STK push sent. Confirm on your phone.' },
          amount: { type: 'number', example: 500 },
          paymentMethod: { type: 'string', example: 'mpesa' },
          isAnonymous: { type: 'boolean', example: false },
        },
      },
      DonationStatusResponse: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', example: 'MPESA-A1B2C3D4' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed'], example: 'completed' },
          amount: { type: 'number', example: 1000 },
          paymentMethod: { type: 'string', example: 'mpesa' },
          isAnonymous: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2026-07-02T09:52:32.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-07-02T09:52:35.000Z' },
          message: { type: 'string', example: 'Donation received successfully.' },
          donorName: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          failureMessage: {
            type: 'string',
            example: 'The request was cancelled to simulate a failed payment response.',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: { type: 'string' },
            example: ['Phone number is required for M-Pesa payments'],
          },
        },
      },
      PaymentErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Payment failed' },
          message: {
            type: 'string',
            example: 'The request was cancelled to simulate a failed payment response.',
          },
        },
      },
      ConflictResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Idempotency conflict' },
          message: { type: 'string', example: 'Idempotency-Key was already used with a different request body.' },
        },
      },
      RateLimitResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Too many requests' },
          message: { type: 'string', example: 'Rate limit exceeded. Please try again later.' },
        },
      },
    },
    examples: {
      MpesaDonationRequest: {
        summary: 'M-Pesa donation',
        value: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          amount: 500,
          paymentMethod: 'mpesa',
          phoneNumber: '254700000000',
          isAnonymous: false,
        },
      },
      CardDonationRequest: {
        summary: 'Card donation',
        value: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          amount: 500,
          paymentMethod: 'card',
          cardNumber: '4111111111111111',
          nameOnCard: 'Jane Doe',
          expiry: '12/28',
          cvc: '123',
          isAnonymous: true,
        },
      },
    },
  },
};

export default swaggerDocument;
