
const express = require('express'); 
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express'); 
const swaggerDocument = require('./config/swagger'); 

// Create an instance of the Express application
const app = express();
const PORT = process.env.PORT || 3001; 

// Enable CORS for all routes (completely open)
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Middleware to parse incoming JSON requests

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerDocument);
});
//  swagger documentation config
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

// Define a health check endpoint that responds with a JSON object indicating the API status
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' }); 
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); 
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`); 
});