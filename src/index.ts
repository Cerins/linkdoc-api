import defineUser from './app/model/user';
import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import config from './config';
import WSWebsocket from './routes/websocket/ws';
import defineSocketController from './controllers/websocket';
import { buildDB } from './utils/sqlite';
import sqliteSetupScripts from './app/gateway/sqlite/setup';
import defineUserGateway from './app/gateway/sqlite/user';

async function main() {
    const logger = createLogger();
    const db = await buildDB(
        {
            config: config.app.source.sqlite,
            logger
        },
        sqliteSetupScripts
    );
    const GateWays = {
        UserGateway: defineUserGateway({
            db
        })
    };
    const models = {
        User: defineUser(GateWays, {
            saltRounds: config.app.model.User.saltRounds
        })
    };
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
    SocketController.registerHandler('TEST', function (payload, ws, next) {
        ws.send(JSON.stringify(payload));
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
