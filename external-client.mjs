import { WebSocket } from 'ws';

export const createExternalClient = () => {
  return new Promise((resolve, reject) => {
    const thirdPartySocket = new WebSocket('wss://echo.websocket.org');

    thirdPartySocket.onopen = () => {
      console.log('[EchoWebsocket] connection established');
      resolve(thirdPartySocket);
    };

    thirdPartySocket.onerror = (error) => {
      console.error('[EchoWebsocket] error:', error);
      reject(error);
    };
  });
};
