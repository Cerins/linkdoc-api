import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import config from './config';
import WSWebsocket from './routes/websocket/ws';
import defineSocketController, { ISocketController } from './controllers/websocket';
import SQLiteGateways from './app/gateway/sqlite';
import Models from './app/model';


async function main() {
    const logger = createLogger();
    const gateway = await SQLiteGateways.create(logger);
    const models = new Models({
        gateway: gateway
    });
    const controllers = {
        HTTPUserController: defineHTTPUserController({
            models
        })
    };
    const httpRouter = new ExpressAPI({
        controllers,
        logger,
        config: {
            port: config.routes.http.port
        }
    });
    // TODO - Setup config
    const SocketController = defineSocketController({
        config: {
            baseUrl: 'http://localhost:3000'
        },
        logger,
        models
    });
    SocketController.registerHandler('TEST', function (
        this: ISocketController,
        payload, ws, next) {
        const full = {
            user: {
                name: this.user.name,
                id: this.user.id,
                says: payload
            }
        };
        ws.send(JSON.stringify(full));
    });

    const wsRouter = new WSWebsocket({
        logger,
        config: {
            port: config.routes.websocket.port
        },
        controllers: {
            SocketController
        }
    });
    await httpRouter.start();
    await wsRouter.start();
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
});
