import { ICollectionGateway } from './collection';
import { IObjectGateway, ObjectGatewayType } from './object';

interface IUserGateway extends IObjectGateway {
  name: string;
  password: string;
  getCollections(): Promise<ICollectionGateway[]>;
}

interface UserGatewayType
  extends ObjectGatewayType<IUserGateway> {}


export {
    IUserGateway,
    UserGatewayType
};