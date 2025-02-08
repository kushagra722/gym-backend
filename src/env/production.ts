export default {
    environment: 'production',
    databaseUrl: process.env.PRODUCTION_DATABASE_URL,
    secretKey: process.env.PRODUCTION_SECRET_KEY,
    port:5001
    // Other production-specific settings...
  };