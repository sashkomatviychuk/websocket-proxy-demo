// @ts-check
import { jest } from '@jest/globals';

const mockWebSocket = jest.fn();

const mockWebSocketInstance = {
  on: jest.fn(),
  send: jest.fn(),
};

jest.unstable_mockModule('ws', () => ({
  WebSocket: mockWebSocket.mockImplementation(() => mockWebSocketInstance),
}));

const { setupEchoServerConnection } = await import('../echo.service.mjs');

describe('setupEchoServerConnection', () => {
  let pub, sub;

  beforeEach(() => {
    jest.clearAllMocks();

    pub = {
      publish: jest.fn(),
    };

    sub = {
      subscribe: jest.fn(),
    };

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should connect to WebSocket and setup listeners', async () => {
    const onHandlers = {};

    mockWebSocketInstance.on.mockImplementation((event, handler) => {
      onHandlers[event] = handler;
    });

    const connectionFn = setupEchoServerConnection({ pub, sub });

    const promise = connectionFn();

    onHandlers.open();

    await promise;

    expect(mockWebSocket).toHaveBeenCalledWith('wss://echo.websocket.org');
    expect(mockWebSocketInstance.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWebSocketInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(sub.subscribe).toHaveBeenCalledWith('external:bus', expect.any(Function));

    // Simulate external message
    const testIncoming = 'incoming message';
    onHandlers['message'](testIncoming);

    expect(pub.publish).toHaveBeenCalledWith('client:bus', testIncoming);

    // Simulate subscribe call
    const testOutgoing = 'outgoing message';
    const callback = sub.subscribe.mock.calls[0][1];

    callback(testOutgoing);
    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(testOutgoing);
  });

  it('should log and return when WebSocket connection fails', async () => {
    const onHandlers = {};

    mockWebSocketInstance.on.mockImplementation((event, handler) => {
      onHandlers[event] = handler;
    });

    const connectionFn = setupEchoServerConnection({ pub, sub });

    const promise = connectionFn();
    const fakeError = new Error('Failed to connect');

    onHandlers['error'](fakeError);

    await promise;

    expect(console.error).toHaveBeenCalledWith(
      'Failed to connect to the third-party WebSocket service'
    );
    expect(mockWebSocketInstance.on).not.toHaveBeenCalledWith('message', expect.any(Function));
    expect(sub.subscribe).not.toHaveBeenCalled();
  });
});
