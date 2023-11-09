import type ILogger from '../../utils/interface/logger';
import { IUser, IUserType } from '../../app/model/interface/user';
import JWT from '../../utils/jwt';
import { z } from 'zod';
import type { HandlerFn } from './handlers';

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
    User: IUserType;
  };
}

const messageSchema = z.object({
    type: z.string(),
    payload: z.unknown()
});

export default function defineSocketController(dependencies: Dependencies) {
    const { logger } = dependencies;
    type OnComplete = (err: Error | null, user: IUser | undefined)=>void;
    return class SocketController {
        protected static onMessageHandlers = new Map<string, HandlerFn>();

        public static registerHandler(
            name: string,
            handler: HandlerFn
        ) {
            if(SocketController.onMessageHandlers.has(name)) {
                throw new Error('Handler already registered');
            }
            SocketController.onMessageHandlers.set(name, handler);
        }

        protected ws: IWebSocket;

        protected user: IUser;

        public constructor(ws: IWebSocket, user: IUser) {
            this.ws = ws;
            this.user = user;
        }

        public connect() {
            this.ws.on('error', this.onError.bind(this));
            this.ws.on('message', this.onMessage.bind(this));
            this.ws.on('close', this.onClose.bind(this));
        }

        public onError() {
            logger.log('error', 'Socket error');
        }

        protected errorMiddleware() {

        }

        public onMessage(data: Buffer) {
            // First
            // Take the data and parse it as JSON
            // Then check if it matches the schema
            const content = JSON.parse(data.toString());
            const message = messageSchema.parse(content);
            const { type: name, payload } = message;
            // Check if the handler exists
            const handler = SocketController.onMessageHandlers.get(name);
            if(!handler) {
                throw new Error('Handler not found');
            }
            // Call the handler
            handler.call(this,payload, this.ws, this.errorMiddleware.bind(this));
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
            head: unknown,
            onComplete?: OnComplete
        ) {
            if(onComplete === undefined) {
                onComplete = ()=>{};
            }
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
                const user = await User.findOne({ id: jwt.get<string>('usrID') });
                if (!user) {
                    throw new Error('User not found');
                }
                return user;
            }
            socket.on('error', SocketController.onError);
            auth()
                .then((user: IUser) => {
                    socket.removeListener('error', SocketController.onError);
                    onComplete!(
                        null,
                        user
                    );
                    this.handleUpgrade(request, socket, head, (ws) => {
                        const socketController = new SocketController(ws, user);
                        this.emit('connection', socketController);
                    });
                })
                .catch((err) => {
                    onComplete!(err, undefined);
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
export type { SocketControllerType, ISocketController, IWebSocket, ISocket, IWebSocketServer };

