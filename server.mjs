// @ts-check
import express from 'express';
import http from 'http';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { setupEchoServerConnection } from './setup-echo-ws.mjs';
import { createWsApp } from './ws-app.mjs';

dotenv.config();

const pub = createClient();
const sub = pub.duplicate();

await pub.connect();
await sub.connect();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const clients = new Map();

app.use(express.static('public'));

createWsApp(server, ({ ws, req, wss }) => {
  const userId = Math.random().toString(36).substring(2, 15);

  console.log('Client connected:', userId);

  clients.set(userId, ws);

  ws.on('message', handleWsMessage({ userId, pub, ws, wss }));
  ws.on('close', () => handleWsDisconnect({ userId }));
});

function handleWsMessage({ userId, pub, ws, wss }) {
  return async (message) => {
    console.log('Message from client:', message.toString());

    const payload = JSON.stringify({ userId, message: message.toString() });

    pub.publish('external:bus', payload);
  };
}

function handleWsDisconnect({ userId }) {
  return async () => {
    console.log('Client disconnected:', userId);
    // Additional cleanup if necessary
  };
}

sub.subscribe('client:bus', (message) => {
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
});

// Utility function to safely send messages to WebSocket clients
const sendMessage = (socket, message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  }
};

const parseJson = (message) => {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
};

await setupEchoServerConnection({ pub, sub });

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
