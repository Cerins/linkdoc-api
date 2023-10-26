import { ColVisibility } from './collection';
import { IObjectGateway, ObjectGatewayType } from './object';

interface IUserCollectionGateway extends IObjectGateway {
    userID: string;
    collectionID: string;
    visibility: ColVisibility
}

interface UserCollectionGatewayType
    extends ObjectGatewayType<IUserCollectionGateway> {}

export {
    IUserCollectionGateway,
    UserCollectionGatewayType
};