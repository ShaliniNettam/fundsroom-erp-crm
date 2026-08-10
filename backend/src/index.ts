import app from './app.js';
import { ENV } from './config/env.js';
import { prisma } from './config/db.js';

const PORT = parseInt(ENV.PORT, 10);

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database via Prisma.');

    app.listen(PORT, () => {
      console.log(`🚀 Mini ERP Backend Server listening on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database or start server:', error);
    process.exit(1);
  }
}

startServer();
