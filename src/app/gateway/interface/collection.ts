// TODO const enum works weird
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import { IDocumentGateway } from './document';
import { IObjectGateway, ObjectGatewayType } from './object';

const enum ColVisibility {
    PUBLIC = 0,
    READ = 1,
    WRITE = 2,
}

interface ICollectionGateway extends IObjectGateway {
        name: string;
        description: string | null;
        createdAt: Date;
        userID: string;
        visibility: ColVisibility
        hasAccess(usrID: string): Promise<boolean>;
}

interface CollectionGatewayType
    extends ObjectGatewayType<ICollectionGateway> {

}

export {
    ICollectionGateway,
    CollectionGatewayType,
    ColVisibility
};
