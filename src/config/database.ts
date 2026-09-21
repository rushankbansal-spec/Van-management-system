import mongoose from 'mongoose';
import config from './environment';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.db.uri, {
      maxPoolSize: 10,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', (error as Error).message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

export default connectDB;
