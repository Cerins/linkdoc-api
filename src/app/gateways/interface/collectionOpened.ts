import { IObjectGateway, ObjectGatewayType } from './object';

interface ICollectionOpenedGateway extends IObjectGateway {
    userID: string;
    collectionID: string;
    opened: Date
}

interface CollectionOpenedGatewayType
    extends ObjectGatewayType<ICollectionOpenedGateway> {}

export {
    ICollectionOpenedGateway,
    CollectionOpenedGatewayType
};