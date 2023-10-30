import config from '../../config';
import type { CollectionGatewayType } from '../gateway/interface/collection';
import type { DocumentGatewayType } from '../gateway/interface/document';
import type { UserGatewayType } from '../gateway/interface/user';
import type { UserCollectionGatewayType } from '../gateway/interface/userCollection';
import defineCollection from './collection';
import defineDocument from './document';
import type { ICollectionType } from './interface/collection';
import type { IDocumentType } from './interface/document';
import type { IUserType } from './interface/user';
import defineUser from './user';

interface Dependencies {
  gateway: {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
    Document: DocumentGatewayType;
  };
}

export default class Models {
    User: IUserType;
    Collection: ICollectionType;
    Document: IDocumentType;

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
            gateway,
            model: this
        });
        this.Document = defineDocument({
            gateway
        });
    }
}
