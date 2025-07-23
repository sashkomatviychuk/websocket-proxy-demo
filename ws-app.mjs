import { WebSocketServer } from 'ws';

/**
 * @returns {WebSocketServer}
 */
export const createWsApp = (server, handler) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');

    handler({ ws, req, wss });
  });

  return wss;
};
