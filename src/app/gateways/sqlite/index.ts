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
import { DocumentGatewayType } from '../interface/document';
import defineDocumentGateway from './document';
import { PubSubGatewayType } from '../interface/pubsub';
import PubSub from '../memory/pubsub';
import { CollectionOpenedGatewayType } from '../interface/collectionOpened';
import defineCollectionOpenedGateway from './collectionOpened';
import Lock from '../memory/lock';
import { LockGatewayType } from '../interface/lock';
import { CacheGatewayType } from '../interface/cache';
import Cache from '../memory/cache';
import { FileGatewayType } from '../interface/file';
import defineFileGateway from './file';

// Create a collection of gateways that use SQLite
// Because this is a preset i do not see the damage of
// including a method that also creates a db
export default class SQLiteGateways {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
    CollectionOpened: CollectionOpenedGatewayType;
    Document: DocumentGatewayType;
    PubSub: PubSubGatewayType;
    Lock: LockGatewayType;
    Cache: CacheGatewayType;
    File: FileGatewayType;
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
        this.Document = defineDocumentGateway({
            db
        });
        this.CollectionOpened = defineCollectionOpenedGateway({
            db
        });
        this.File = defineFileGateway({
            db,
            config: {
                dir: config.app.model.File.dir
            }
        });
        this.PubSub = PubSub;
        this.Lock = Lock;
        this.Cache = Cache;

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
