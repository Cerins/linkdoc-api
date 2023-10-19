import defineUser from './app/model/user';
import UserMemoryGateway from './app/gateway/memory/user';
import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';

// TODO - Move to .env file
const UserConfig = {
    saltRounds: 10
};

const models = {
    User: defineUser(
        {
            UserGateway: UserMemoryGateway
        },
        UserConfig
    )
};

// Register a user for testing
models.User.register('username', 'password');

const logger = createLogger();

const controllers = {
    HTTPUserController: defineHTTPUserController({
        models
    })
};

const httpUserRouter = new ExpressAPI({
    controllers,
    logger
});

httpUserRouter.start().catch((err) => {
    logger.log('error', 'Error starting server', err);
});
