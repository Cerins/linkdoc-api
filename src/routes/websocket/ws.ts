import ILogger from '../../utils/interface/logger';
import http from 'http';
import WebSocket from 'ws';

function onSocketError(err: unknown) {
    console.error(err);
}

interface Dependencies {
    logger: ILogger
    config: {
        port: number;
    }
}

class WSWebsocket {
    protected dependencies: Dependencies;

    protected server: http.Server;

    protected webSocketServer: WebSocket.Server;

    protected get config() {
        return this.dependencies.config;
    }

    protected get logger() {
        return this.dependencies.logger;
    }

    constructor(dependencies: Dependencies) {
        this.dependencies = dependencies;
        this.server = http.createServer();
        this.webSocketServer = new WebSocket.Server({ noServer: true });
        this.server.on('upgrade', (request, socket, head) => {
            socket.on('error', onSocketError);

        });
    }

    public async start() {
        this.server.listen(this.config.port, () => {
            this.logger.log('info', `Socket server started on port ${this.config.port}`);
        });
    }


}

export default WSWebsocket;