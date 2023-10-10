import { IObjectGateway, ObjectGatewayType } from './object';

interface IUserGateway extends IObjectGateway {
  name: string;
  password: string;
}

interface UserGatewayType
  extends ObjectGatewayType<IUserGateway> {}


export {
    IUserGateway,
    UserGatewayType
};