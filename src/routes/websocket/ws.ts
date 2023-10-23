import ILogger from '../../utils/interface/logger';
import http from 'http';
import WebSocket from 'ws';
import {
    ISocketController,
    SocketControllerType
} from '../../controllers/websocket';

interface Dependencies {
  logger: ILogger;
  config: {
    port: number;
  };
  controllers: {
    SocketController: SocketControllerType;
  };
}

class WSWebsocket {
    protected dependencies: Dependencies;

    protected server: http.Server;

    protected wss: WebSocket.Server;

    protected get config() {
        return this.dependencies.config;
    }

    protected get logger() {
        return this.dependencies.logger;
    }

    constructor(dependencies: Dependencies) {
        this.dependencies = dependencies;
        const { SocketController } = dependencies.controllers;
        this.server = http.createServer({});
        this.wss = new WebSocket.Server({ noServer: true });
        this.wss.on('connection', (controller: ISocketController) => {
            controller.connect();
        });
        this.server.on('upgrade', SocketController.onUpgrade.bind(this.wss));
    }

    public async start() {
        this.server.listen(this.config.port, () => {
            this.logger.log(
                'info',
                `Socket server started on port ${this.config.port}`
            );
        });
    }
}

export default WSWebsocket;
