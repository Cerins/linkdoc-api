import { IObjectGateway, ObjectGatewayType } from './object';

type getCollectionList = (options?: {
    before?: Date
    limit?: number
}) => Promise<{
    colUUID: string,
    time: Date
}[]>

type getCollectionListArgs = Parameters<getCollectionList>
type getCollectionListReturn = Awaited<ReturnType<getCollectionList>>

interface IUserGateway extends IObjectGateway {
  name: string;
  password: string;
  getCollectionList(...args: getCollectionListArgs): Promise<getCollectionListReturn>
}

interface UserGatewayType
  extends ObjectGatewayType<IUserGateway> {}


export type {
    IUserGateway,
    UserGatewayType,
    getCollectionList,
    getCollectionListArgs,
    getCollectionListReturn
};