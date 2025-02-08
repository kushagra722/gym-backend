export default {
    environment: 'staging',
    databaseUrl: process.env.STAGING_DATABASE_URL,
    secretKey: process.env.STAGING_SECRET_KEY,
    port:6001
    // Other staging-specific settings...
  };
  