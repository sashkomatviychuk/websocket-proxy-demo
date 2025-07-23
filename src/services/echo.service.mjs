// @ts-check
import { WebSocket } from 'ws';
import { CLIENT_CHANNEL, ECHO_SERVER_ADDRESS, EXTERNAL_CHANNEL } from '../constants.mjs';

const createExternalClient = () => {
  return new Promise((resolve) => {
    const thirdPartySocket = new WebSocket(ECHO_SERVER_ADDRESS);

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

export const setupEchoServerConnection = ({ pub, sub }) => {
  return async () => {
    const thirdPartySocket = await createExternalClient();

    if (!thirdPartySocket) {
      console.error('Failed to connect to the third-party WebSocket service');
      return;
    }

    thirdPartySocket.on('message', (message) => pub.publish(CLIENT_CHANNEL, message));
    thirdPartySocket.on('close', () => console.log('Third-party service disconnected'));

    sub.subscribe(EXTERNAL_CHANNEL, (message) => thirdPartySocket.send(message));
  };
};
