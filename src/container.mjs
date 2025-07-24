// @ts-check
import { createContainer, asValue, asFunction } from 'awilix';

import { pub, sub } from './services/pubsub.service.mjs';
import {
  handleWsMessage,
  handleWsDisconnect,
  handleOnClientMessage,
} from './services/ws.service.mjs';
import { setupEchoServerConnection } from './services/echo.service.mjs';

export const container = createContainer();

container.register({
  pub: asValue(pub),
  sub: asValue(sub),
  clients: asValue(new Map()),
  handleWsMessage: asFunction(handleWsMessage).scoped(),
  handleWsDisconnect: asFunction(handleWsDisconnect).scoped(),
  handleOnClientMessage: asFunction(handleOnClientMessage).scoped(),
  setupEchoServerConnection: asFunction(setupEchoServerConnection).singleton(),
});
