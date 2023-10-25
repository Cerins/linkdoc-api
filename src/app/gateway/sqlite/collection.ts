import { Knex } from 'knex';
import defineBaseGateway from './base';
import { ICollectionGateway } from '../interface/collection';

interface Dependencies {
    db: Knex
}
export default function defineCollectionGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<ICollectionGateway>(
        {
            db
        },
        {
            tableName: 'Collection',
            physicalNames: {
                id: 'colID',
                name: 'colName',
                description: 'colDescription',
                createdAt: 'colCreatedAt',
                userID: 'col_usrID',
                visibility: 'colVisibility'
            }
        }
    );
    class Collection extends Base implements ICollectionGateway {
        public async hasAccess(usrID: string) {
            return true;
        }
    }
    return Collection;
}