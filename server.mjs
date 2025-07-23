// @ts-check
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { setupEchoServerConnection } from './src/services/echo.service.mjs';
import { createWsApp, handleWsMessage, handleWsDisconnect, handleOnClientMessage } from './src/services/ws.service.mjs';
import { createUserId } from './src/services/user.service.mjs';
import { shutdown } from './src/utils/shutdown.mjs';

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

const wss = createWsApp(server, ({ ws, req, wss }) => {
  const userId = createUserId();

  console.log('Client connected:', userId);

  clients.set(userId, ws);

  ws.on('message', handleWsMessage({ userId, pub, ws, wss }));
  ws.on('close', () => handleWsDisconnect({ userId }));
});

sub.subscribe('client:bus', handleOnClientMessage({ clients }));

await setupEchoServerConnection({ pub, sub });

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => shutdown({ server, wss }));
process.on('SIGTERM', () => shutdown({ server, wss }));
