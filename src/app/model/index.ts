import config from '../../config';
import { CollectionGatewayType } from '../gateway/interface/collection';
import { UserGatewayType } from '../gateway/interface/user';
import { UserCollectionGatewayType } from '../gateway/interface/userCollection';
import defineCollection from './collection';
import { ICollectionType } from './interface/collection';
import { IUserType } from './interface/user';
import defineUser from './user';

interface Dependencies {
  gateway: {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
  };
}

export default class Models {
    User: IUserType;
    Collection: ICollectionType;

    constructor(dependencies: Dependencies) {
        const { gateway } = dependencies;
        this.User = defineUser(
            {
                gateway,
                model: this
            },
            {
                saltRounds: config.app.model.User.saltRounds
            }
        );
        this.Collection = defineCollection({
            gateway
        });
    }
}
