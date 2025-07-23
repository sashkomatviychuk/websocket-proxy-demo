// @ts-check
import { WebSocket } from 'ws';

const closeWebSocket = ({ wss }, callback) => {
  if (!wss) {
    return callback();
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'system', message: 'Server is shutting down' }));
      client.close(1001, 'Server shutdown'); // 1001 = Going Away
    }
  });

  // Close WebSocket server
  wss.close(callback);
};

let isShuttingDown = false;

export const shutdown = ({ server, wss }) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log('\nShutting down gracefully...');

  // Stop accepting new HTTP connections
  server.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    console.log('HTTP server closed.');
  });

  closeWebSocket({ wss }, () => {
    console.log('WebSocket server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.warn('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};
