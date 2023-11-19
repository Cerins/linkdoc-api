import config from '../../config';
import type { CollectionGatewayType } from '../gateways/interface/collection';
import type { DocumentGatewayType } from '../gateways/interface/document';
import type { UserGatewayType } from '../gateways/interface/user';
import type { UserCollectionGatewayType } from '../gateways/interface/userCollection';
import defineCollection from './collection';
import defineDocument from './document';
import type { ICollectionType } from './interface/collection';
import type { IDocumentType } from './interface/document';
import type { IUserType } from './interface/user';
import defineUser from './user';

interface Dependencies {
  gateways: {
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
        const { gateways } = dependencies;
        this.User = defineUser(
            {
                gateways,
                models: this
            },
            {
                saltRounds: config.app.model.User.saltRounds
            }
        );
        this.Collection = defineCollection({
            gateways,
            models: this
        });
        this.Document = defineDocument({
            gateways
        });
    }
}
