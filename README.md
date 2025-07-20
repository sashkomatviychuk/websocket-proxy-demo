# WebSocket Proxy Demo

This project demonstrates a WebSocket proxy server that connects a frontend client to a third-party WebSocket service. The backend server is built using Node.js, Express.js, and the `ws` package. The third-party WebSocket service used in this demo is `wss://echo.websocket.org`.

## Features

- **WebSocket Proxy**: Relays messages between the client and the third-party WebSocket service.
- **Frontend Interface**: A simple HTML page to send and receive WebSocket messages.
- **Environment Configuration**: Uses `.env` file to configure the application port.

## Project Structure

```
websocket-proxy-demo/
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Node.js dependencies
├── public/             # Frontend files
│   └── index.html      # Frontend HTML page
├── server.mjs          # Backend server
└── README.md           # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sashkomatviychuk/websocket-proxy-demo.git
   ```

2. Navigate to the project directory:

   ```bash
   cd websocket-proxy-demo
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory (already included in this project):

   ```env
   PORT=3000
   ```

2. Modify the `PORT` value if needed.

## Running the Application

1. Start the server:

   ```bash
   node server.mjs
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

3. Use the frontend interface to send and receive WebSocket messages.

## How It Works

1. The backend server listens for WebSocket connections from the client.
2. When a client connects, the server establishes a connection to the third-party WebSocket service (`wss://echo.websocket.org`).
3. Messages sent by the client are relayed to the third-party service, and responses from the service are relayed back to the client.

## License

This project is licensed under the MIT License.
