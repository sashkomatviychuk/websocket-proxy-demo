import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { createClient } from 'redis';

import { createExternalClient } from './external-client.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const wss = new WebSocketServer({ noServer: true });

// Initialize Redis clients
const redisPublisher = createClient();
const redisSubscriber = createClient();

await redisPublisher.connect();
await redisSubscriber.connect();

// Handle WebSocket connections
wss.on('connection', async (clientSocket) => {
  console.log('Client connected', wss.clients.size);

  const thirdPartySocket = await createExternalClient();

  // Relay messages from the client to the third-party service via Redis
  clientSocket.on('message', (message) => {
    console.log('Message from client:', message.toString());
    redisPublisher.publish('toThirdParty', message);
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
    thirdPartySocket.close();
  });

  // Subscribe to messages from the third-party service via Redis
  redisSubscriber.subscribe('toClient', (message) => {
    console.log('Message from third-party to client:', message);

    if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(message);
    }
  });

  // Relay messages from the third-party service to the client
  thirdPartySocket.on('message', async (message) => {
    console.log('Message from third-party service:', message.toString());
    // clientSocket.send(message);
    await redisPublisher.publish('toClient', message);
  });

  thirdPartySocket.on('close', () => {
    console.log('Third-party service disconnected');
    clientSocket.close();
  });

  redisSubscriber.subscribe('toThirdParty', (message) => {
    console.log('Message from client to third-party:', message);
    thirdPartySocket.send(message);
  });
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
