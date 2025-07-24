// @ts-check
import http from 'http';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { asValue } from 'awilix';
import session from 'express-session';

import { createWsApp } from './src/services/ws.service.mjs';
import { shutdown } from './src/utils/shutdown.mjs';
import { container } from './src/container.mjs';
import { CLIENT_CHANNEL } from './src/constants.mjs';
import { routes } from './src/routes.mjs';

dotenv.config();

const __dirname = path.resolve();
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

const sessionParser = session({
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET ?? 'secret',
  resave: true,
});

// views config
app.set('views', path.join(__dirname, './src/views'));
app.set('view engine', 'ejs');

// body parser and session middleware
app.use(sessionParser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

const wss = createWsApp(server, ({ ws, req, wss }) => {
  const scope = container.createScope();

  // @ts-ignore
  sessionParser(req, {}, () => {
    const userId = req.session.userId;

    if (!userId) {
      console.log('Unauthorized WebSocket connection attempt');
      ws.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      ws.destroy();
      return;
    }

    console.log(`Client connected with userId: ${userId}`);

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
});

const { sub, handleOnClientMessage, setupEchoServerConnection } = container.cradle;

sub.subscribe(CLIENT_CHANNEL, handleOnClientMessage);

await setupEchoServerConnection();

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => shutdown({ server, wss }));
process.on('SIGTERM', () => shutdown({ server, wss }));
