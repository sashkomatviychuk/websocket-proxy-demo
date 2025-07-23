import { WebSocket } from 'ws';

const createExternalClient = () => {
  return new Promise((resolve, reject) => {
    const thirdPartySocket = new WebSocket('wss://echo.websocket.org');

    thirdPartySocket.on('open', () => {
      console.log('[EchoWebsocket] connection established');
      resolve(thirdPartySocket);
    });

    thirdPartySocket.on('error', () => {
      console.error('[EchoWebsocket] error:', error);
      reject(error);
    });
  });
};

export const setupEchoServerConnection = async ({ pub, sub }) => {
  const thirdPartySocket = await createExternalClient();

  thirdPartySocket.on('message', (message) => pub.publish('client:bus', message));
  thirdPartySocket.on('close', () => console.log('Third-party service disconnected'));

  sub.subscribe('external:bus', (message) => thirdPartySocket.send(message));
};
