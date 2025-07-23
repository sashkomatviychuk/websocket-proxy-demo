// @ts-check
import { WebSocket } from 'ws';

const createExternalClient = () => {
  return new Promise((resolve) => {
    const thirdPartySocket = new WebSocket('wss://echo.websocket.org');

    thirdPartySocket.on('open', () => {
      console.log('[EchoWebsocket] connection established');
      resolve(thirdPartySocket);
    });

    thirdPartySocket.on('error', (error) => {
      console.error('[EchoWebsocket] error:', error);
      resolve(null);
    });
  });
};

export const setupEchoServerConnection = async (container) => {
  const { pub, sub } = container.cradle;
  const thirdPartySocket = await createExternalClient();

  if (!thirdPartySocket) {
    console.error('Failed to connect to the third-party WebSocket service');
    return;
  }

  thirdPartySocket.on('message', (message) => {
    pub.publish('client:bus', message);
  });
  thirdPartySocket.on('close', () => console.log('Third-party service disconnected'));

  sub.subscribe('external:bus', (message) => thirdPartySocket.send(message));
};
