import defineUser from './app/model/user';
import ExpressAPI from './routes/http/express';
import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import config from './config';
import WSWebsocket from './routes/websocket/ws';
import defineSocketController, { ISocketController } from './controllers/websocket';
import { buildDB } from './utils/sqlite';
import sqliteSetupScripts from './app/gateway/sqlite/setup';
import defineUserGateway from './app/gateway/sqlite/user';
import defineCollectionGateway from './app/gateway/sqlite/collection';
import defineUserCollectionGateway from './app/gateway/sqlite/userCollection';
import { UserGatewayType } from './app/gateway/interface/user';
import { ColVisibility, CollectionGatewayType } from './app/gateway/interface/collection';
import { UserCollectionGatewayType } from './app/gateway/interface/userCollection';
import { Knex } from 'knex';
import { IUserType } from './app/model/interface/user';
import { ICollectionType } from './app/model/interface/collection';
import defineCollection from './app/model/collection';

class Gateways {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
    constructor(db: Knex) {

        this.User = defineUserGateway({
            db
        });
        this.Collection = defineCollectionGateway({
            db
        }),
        this.UserCollection = defineUserCollectionGateway({
            db
        });
    }
}

class Models {
    User: IUserType;
    Collection: ICollectionType;

    constructor(gateways: Gateways) {
        this.User = defineUser({
            gateway: gateways,
            model: this
        }, {
            saltRounds: config.app.model.User.saltRounds
        }),
        this.Collection = defineCollection({
            gateway: gateways
        });
    }
}

async function main() {
    const logger = createLogger();
    const db = await buildDB(
        {
            config: config.app.source.sqlite,
            logger
        },
        sqliteSetupScripts
    );
    const gateways = new Gateways(db);
    const models = new Models(gateways);
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
    const collection = await models.Collection.findOne({
        id: '1'
    });
    await collection!.setVisibility(ColVisibility.READ);
    await collection!.setAccess('2', ColVisibility.WRITE);
    await httpRouter.start();
    await wsRouter.start();
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
});
