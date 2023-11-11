import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import config from './config';
import WSWebsocket from './routes/websocket/ws';
import defineSocketController, { ISocketController } from './controllers/websocket';
import SQLiteGateways from './app/gateway/sqlite';
import Models from './app/model';
import collectionsCreate from './controllers/websocket/handlers/collections/create';


async function main() {
    const logger = createLogger();
    const gateways = await SQLiteGateways.create(logger);
    const models = new Models({
        gateways
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
        models,
        gateways
    });
    SocketController.registerHandler('COLLECTIONS.CREATE', collectionsCreate);

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
