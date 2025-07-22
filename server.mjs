// @ts-check
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createClient } from 'redis';

import { createExternalClient } from './external-client.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const wss = new WebSocketServer({ noServer: true });

// Store connected clients
const clients = new Map();

// Initialize Redis pub/sub clients
const redisPublisher = createClient();
const redisSubscriber = createClient();

await redisPublisher.connect();
await redisSubscriber.connect();

const thirdPartySocket = await createExternalClient();

// Handle WebSocket connections
wss.on('connection', async (clientSocket) => {
  const userId = Math.random().toString(36).substring(2, 15); // Simulate user ID for the client
  clients.set(userId, clientSocket);

  console.log('Client connected', userId);

  // Relay messages from the client to the third-party service via Redis
  clientSocket.on('message', (message) => {
    console.log('Message from client:', message.toString());
    redisPublisher.publish('toThirdParty', JSON.stringify({ userId, message: message.toString() }));
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
    clients.delete(userId);
    thirdPartySocket.close();
  });
});

redisSubscriber.subscribe('toClient', (message) => {
  const data = JSON.parse(message);
  const clientSocket = clients.get(data.userId);

  if (data.message === 'all') {
    clients.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('broadcasted message ' + data.message);
      }
    });
    return;
  }

  if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(message);
  }
});

// Relay messages from the third-party service to the client
thirdPartySocket.on('message', async (message) => {
  console.log('Message from third-party service:', message.toString());
  await redisPublisher.publish('toClient', message);
});

thirdPartySocket.on('close', () => {
  console.log('Third-party service disconnected');
});

redisSubscriber.subscribe('toThirdParty', (message) => {
  thirdPartySocket.send(message);
});

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// https://github.com/websockets/ws/tree/master/examples/express-session-parse
