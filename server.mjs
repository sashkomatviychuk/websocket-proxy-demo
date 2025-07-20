import express from 'express';
import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (clientSocket) => {
  console.log('Client connected');

  const thirdPartySocket = new WebSocket('wss://echo.websocket.org');

  // Relay messages from the client to the third-party service
  clientSocket.on('message', (message) => {
    console.log('Message from client:', message.toString());
    thirdPartySocket.send(message);
  });

  // Relay messages from the third-party service to the client
  thirdPartySocket.on('message', (message) => {
    console.log('Message from third-party service:', message.toString());
    clientSocket.send(message);
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
    thirdPartySocket.close();
  });

  thirdPartySocket.on('close', () => {
    console.log('Third-party service disconnected');
    clientSocket.close();
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
