import { IObjectGateway, ObjectGatewayType } from './object';

type getCollectionList = (options?: {
    before?: Date
    limit?: number
}) => Promise<{
    uuid: string,
    name: string,
    time: Date
    user: string
}[]>

type getCollectionListArgs = Parameters<getCollectionList>
type getCollectionListReturn = Awaited<ReturnType<getCollectionList>>

interface IUserGateway extends IObjectGateway {
  name: string;
  password: string;
  createdAt: Date;
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