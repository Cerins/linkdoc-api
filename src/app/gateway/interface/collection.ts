import { IDocumentGateway } from './document';
import { IObjectGateway, ObjectGatewayType } from './object';

interface ICollectionGateway extends IObjectGateway {
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        userID: string;
        hasAccess(usrID: string): Promise<boolean>;
        getDocuments(): Promise<IDocumentGateway[]>;
}

interface CollectionGatewayType
    extends ObjectGatewayType<ICollectionGateway> {

}

export {
    ICollectionGateway,
    CollectionGatewayType
};
