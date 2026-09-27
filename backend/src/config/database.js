const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  // If MONGODB_URI is set to a real server, try it first
  if (mongoUri && !mongoUri.includes('localhost')) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.log('Falling back to in-memory MongoDB...');
    }
  }

  // Use in-memory MongoDB (for development or when no external DB is available)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-memory MongoDB started: ${conn.connection.host}`);
    console.log('⚠  Data will be lost when the server stops. Set MONGODB_URI for persistence.');
  } catch (memError) {
    // Try localhost as last resort
    try {
      const conn = await mongoose.connect(mongoUri || 'mongodb://localhost:27017/shocket');
      console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (localError) {
      console.error(`MongoDB connection error: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
