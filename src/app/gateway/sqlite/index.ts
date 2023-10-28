import { Knex } from 'knex';
import { CollectionGatewayType } from '../interface/collection';
import { UserGatewayType } from '../interface/user';
import { UserCollectionGatewayType } from '../interface/userCollection';
import defineUserGateway from './user';
import defineCollectionGateway from './collection';
import defineUserCollectionGateway from './userCollection';
import config from '../../../config';
import ILogger from '../../../utils/interface/logger';
import { buildDB } from '../../../utils/sqlite';
import sqliteSetupScripts from './setup';

// Create a collection of gateways that use SQLite
// Because this is a preset i do not see the damage of
// including a method that also creates a db
export default class SQLiteGateways {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
    constructor(db: Knex) {
        this.User = defineUserGateway({
            db
        });
        (this.Collection = defineCollectionGateway({
            db
        })),
        (this.UserCollection = defineUserCollectionGateway({
            db
        }));
    }
    public static async create(logger: ILogger) {
        const db = await buildDB(
            {
                config: config.app.source.sqlite,
                logger
            },
            sqliteSetupScripts
        );
        return new SQLiteGateways(db);
    }
}
