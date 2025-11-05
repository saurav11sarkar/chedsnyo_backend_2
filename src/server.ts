import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import config from './app/config';
import { socketHandler } from './app/helper/socket';

const PORT = config.port || 5000;

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize socket events
socketHandler(io);

const main = async () => {
  try {
    if (!config.mongoUri) throw new Error('MongoDB URI is not defined');

    const mongo = await mongoose.connect(config.mongoUri);
    console.log(`✅ MongoDB connected: ${mongo.connection.host}`);

    // IMPORTANT: Use server.listen() not app.listen()
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error('❌ Error starting server:', error.message || error);
    process.exit(1);
  }
};

main();
