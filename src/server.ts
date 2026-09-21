import { app } from './app';
import connectDB from './config/database';
import config from './config/environment';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Portfolio API Server                                        ║
║   running on port ${config.port}                               ║
║   environment: ${config.nodeEnv.padEnd(40)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
      
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`API base URL: http://localhost:${config.port}/api`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
