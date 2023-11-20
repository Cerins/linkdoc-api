import { Knex } from 'knex';
import defineBaseGateway from './base';
import { ICollectionOpenedGateway } from '../interface/collectionOpened';

interface Dependencies {
    db: Knex
}
export default function defineCollectionOpenedGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<ICollectionOpenedGateway>(
        {
            db
        },
        {
            tableName: 'CollectionOpened',
            physicalNames: {
                id: 'cloID',
                userID: 'clo_usrID',
                collectionID: 'clo_colID',
                opened: 'cloOpened'
            }
        }
    );
    class CollectionAccess extends Base implements ICollectionOpenedGateway {
    }
    return CollectionAccess;
}