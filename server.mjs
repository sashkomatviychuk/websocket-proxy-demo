// @ts-check
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { asValue } from 'awilix';
import { createWsApp } from './src/services/ws.service.mjs';
import { createUserId } from './src/services/user.service.mjs';
import { shutdown } from './src/utils/shutdown.mjs';
import { container } from './src/container.mjs';
import { CLIENT_CHANNEL } from './src/constants.mjs';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const wss = createWsApp(server, ({ ws, req, wss }) => {
  const userId = createUserId();
  const scope = container.createScope();

  container.resolve('clients').set(userId, ws);

  scope.register({
    userId: asValue(userId),
    ws: asValue(ws),
    wss: asValue(wss),
  });

  ws.container = scope;

  const handleWsMessage = scope.resolve('handleWsMessage');
  const handleWsDisconnect = scope.resolve('handleWsDisconnect');

  ws.on('message', handleWsMessage);
  ws.on('close', handleWsDisconnect);
});

const { sub, handleOnClientMessage, setupEchoServerConnection } = container.cradle;

sub.subscribe(CLIENT_CHANNEL, handleOnClientMessage);

await setupEchoServerConnection();

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => shutdown({ server, wss }));
process.on('SIGTERM', () => shutdown({ server, wss }));
