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
  },
};

module.exports = swaggerDocument;
