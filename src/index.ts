import defineUser from './app/model/user';
import UserMemoryGateway from './app/gateway/memory/user';
import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import config from './config';
import WSWebsocket from './routes/websocket/ws';
import defineSocketController from './controllers/websocket';

const models = {
    User: defineUser(
        {
            UserGateway: UserMemoryGateway
        },
        {
            saltRounds: config.app.model.User.saltRounds
        }
    )
};

// Register a user for testing
// TODO - Remove this
models.User.register('username', 'password');

const logger = createLogger();

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

const wsRouter = new WSWebsocket({
    logger,
    config: {
        port: config.routes.websocket.port
    },
    controllers: {
        SocketController
    }
});

httpRouter.start().catch((err) => {
    logger.log('error', 'Error starting http', err);
});

wsRouter.start().catch((err) => {
    logger.log('error', 'Error starting ws', err);
});
