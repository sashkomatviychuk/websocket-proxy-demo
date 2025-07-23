// @ts-check
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { setupEchoServerConnection } from './src/services/echo.service.mjs';
import { createWsApp, handleWsMessage, handleWsDisconnect, handleOnClientMessage } from './src/services/ws.service.mjs';
import { createUserId } from './src/services/user.service.mjs';
import { shutdown } from './src/utils/shutdown.mjs';
import { container } from './src/container.mjs';
import { asValue } from 'awilix';

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

  ws.on('message', handleWsMessage(scope));
  ws.on('close', () => handleWsDisconnect(scope));
});

const { sub } = container.cradle;

sub.subscribe('client:bus', handleOnClientMessage(container));

await setupEchoServerConnection(container);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => shutdown({ server, wss }));
process.on('SIGTERM', () => shutdown({ server, wss }));
