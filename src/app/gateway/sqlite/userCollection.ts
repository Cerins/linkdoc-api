import { Knex } from 'knex';
import defineBaseGateway from './base';
import { IUserCollectionGateway } from '../interface/userCollection';
import { ICollectionGateway } from '../interface/collection';

interface Dependencies {
    db: Knex
}
export default function defineUserCollectionGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<IUserCollectionGateway>(
        {
            db
        },
        {
            tableName: 'UserCollection',
            physicalNames: {
                id: 'uclID',
                userID: 'ucl_usrID',
                collectionID: 'ucl_colID',
                visibility: 'colVisibility'
            }
        }
    );
    class UserCollection extends Base implements IUserCollectionGateway {
    }
    return UserCollection;
}