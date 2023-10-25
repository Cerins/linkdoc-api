import { Knex } from 'knex';
import { IUserGateway, UserGatewayType } from '../interface/user';
import defineBaseGateway from './base';
import { ICollectionGateway } from '../interface/collection';
interface Dependencies {
  db: Knex;
}

export default function defineUserGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<IUserGateway>(
        {
            db
        },
        {
            tableName: 'User',
            physicalNames: {
                id: 'usrID',
                name: 'usrName',
                password: 'usrPassword'
            }
        }
    );
    class User extends Base implements IUserGateway {

    }
    return User;
}
