// @ts-check
import { createContainer, asValue, asFunction } from 'awilix';

import { pub, sub } from './services/pubsub.service.mjs';

export const container = createContainer();

container.register({
  pub: asValue(pub),
  sub: asValue(sub),
  clients: asValue(new Map()),
});
