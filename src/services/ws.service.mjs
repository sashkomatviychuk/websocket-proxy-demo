// @ts-check
import { WebSocketServer } from 'ws';
import { parseJson } from '../utils/json.mjs';

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

export const handleWsMessage = ({ userId, pub, ws, wss }) => {
  return async (message) => {
    console.log('Message from client:', message.toString());

    const payload = JSON.stringify({ userId, message: message.toString() });

    pub.publish('external:bus', payload);
  };
};

export const handleWsDisconnect = ({ userId }) => {
  return async () => {
    console.log('Client disconnected:', userId);
  };
};

export const handleOnClientMessage = ({ clients }) => {
  return (message) => {
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
  };
};

// Utility function to safely send messages to WebSocket clients
const sendMessage = (socket, message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  }
};
