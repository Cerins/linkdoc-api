import type ILogger from '../../utils/interface/logger';
import { IUser } from '../../app/model/interface/user';
import JWT from '../../utils/jwt';
import { unknown } from 'zod';

interface ISocket {
  on(event: string, callback: (...args: unknown[]) => void): void;
  write(data: string): void;
  destroy(): void;
  removeListener(event: string, callback: (...args: unknown[]) => void): void;
}

type SocketOnFn = ((event: 'error', callback: (err: unknown) => void) => void) &
  ((event: 'message', callback: (data: Buffer) => void) => void) &
  ((event: 'close', callback: () => void) => void);

interface IWebSocket {
  on: SocketOnFn;
  send: (data: Buffer | string) => void;
}

// Extract the types from the
type IRequest = {
  url?: string;
};

interface IWebSocketServer {
  handleUpgrade(
    request: IRequest,
    socket: ISocket,
    head: unknown,
    callback: (ws: IWebSocket) => void
  ): void;
  emit(event: string, ...args: unknown[]): void;
}

interface Dependencies {
  config: {
    baseUrl: string;
  };
  logger: ILogger;
  models: {
    User: IUser;
  };
}

export default function defineSocketController(dependencies: Dependencies) {
    const { logger } = dependencies;
    return class SocketController {
        ws: IWebSocket;

        public constructor(ws: IWebSocket) {
            this.ws = ws;
        }

        public connect() {
            this.ws.on('error', this.onError.bind(this));
            this.ws.on('message', this.onMessage.bind(this));
            this.ws.on('close', this.onClose.bind(this));
        }

        public onError() {
            logger.log('error', 'Socket error');
        }

        public onMessage(data: Buffer) {
            logger.log('info', 'Socket message', {
                data
            });
            this.ws.send(
                JSON.stringify({
                    message: 'Hello from the server'
                })
            );
        }

        public onClose() {
            logger.log('info', 'Socket closed');
        }

        protected static onError(err: unknown) {
            logger.log('error', 'Socket error', {
                err
            });
        }

        public static onUpgrade(
            this: IWebSocketServer,
            request: IRequest,
            socket: ISocket,
            head: unknown
        ) {
            async function auth() {
                const { url } = request;
                if (!url) {
                    throw new Error('URL not found');
                }
                const parsedUrl = new URL(url, dependencies.config.baseUrl);
                // Get all query params
                const token = parsedUrl.searchParams.get('token');
                if (typeof token !== 'string') {
                    throw new Error('Token not found');
                }
                const jwt = JWT.validate(token);
                const { User } = dependencies.models;
                const user = await User.find({ id: jwt.get<string>('usrID') });
                if (!user) {
                    throw new Error('User not found');
                }
                return user;
            }
            socket.on('error', SocketController.onError);
            auth()
                .then(() => {
                    socket.removeListener('error', SocketController.onError);
                    this.handleUpgrade(request, socket, head, (ws) => {
                        const socketController = new SocketController(ws);
                        this.emit('connection', socketController);
                    });
                })
                .catch((err) => {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    logger.log('error', 'Socket authentication failed', {
                        err
                    });
                });
        }
    };
}

type SocketControllerType = ReturnType<typeof defineSocketController>;
// Get the instance type
type ISocketController = InstanceType<SocketControllerType>;
export type { SocketControllerType, ISocketController };
