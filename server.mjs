// @ts-check
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createExternalClient } from './external-client.mjs';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize Redis clients
const redisPublisher = createClient();
const redisSubscriber = createClient();

// Initialize WebSocket server and Express app
const wss = new WebSocketServer({ noServer: true });
const app = express();

// Store connected clients
const clients = new Map();

// Utility function to safely send messages to WebSocket clients
const sendMessage = (socket, message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  }
};

// Handle WebSocket connections
const handleWebSocketConnection = async (clientSocket) => {
  const userId = Math.random().toString(36).substring(2, 15); // Generate a unique user ID
  clients.set(userId, clientSocket);

  console.log('Client connected:', userId);

  clientSocket.on('message', (message) => handleClientMessage(userId, message));
  clientSocket.on('close', () => handleClientDisconnection(userId));
};

// Handle messages from WebSocket clients
const handleClientMessage = (userId, message) => {
  console.log('Message from client:', message.toString());
  redisPublisher.publish('toThirdParty', JSON.stringify({ userId, message: message.toString() }));
};

// Handle client disconnection
const handleClientDisconnection = (userId) => {
  console.log('Client disconnected:', userId);
  clients.delete(userId);
};

const parseJson = (message) => {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
};

// Handle messages from Redis to WebSocket clients
const handleRedisToClientMessage = (message) => {
  const data = parseJson(message);

  if (!data || !data.userId) {
    return;
  }

  const clientSocket = clients.get(data.userId);

  if (data.message === 'all') {
    clients.forEach((socket) => sendMessage(socket, `broadcasted message ${data.message}`));
    return;
  }

  if (clientSocket) {
    sendMessage(clientSocket, message);
  }
};

// Relay messages from the third-party service to Redis
const handleThirdPartyMessage = async (message) => {
  console.log('Message from third-party service:', message.toString());
  await redisPublisher.publish('toClient', message);
};

// Initialize third-party WebSocket client
const initializeThirdPartySocket = async () => {
  const thirdPartySocket = await createExternalClient();

  thirdPartySocket.on('message', handleThirdPartyMessage);
  thirdPartySocket.on('close', () => console.log('Third-party service disconnected'));

  redisSubscriber.subscribe('toThirdParty', (message) => thirdPartySocket.send(message));

  return thirdPartySocket;
};

// Setup WebSocket server
const setupWebSocketServer = () => {
  wss.on('connection', handleWebSocketConnection);

  app.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
};

// Start the server
const startServer = async () => {
  try {
    await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);

    redisSubscriber.subscribe('toClient', handleRedisToClientMessage);

    await initializeThirdPartySocket();

    setupWebSocketServer();

    app.use(express.static('public'));

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
