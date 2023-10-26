import { ICollectionGateway } from '../../gateway/interface/collection';

interface ICollection {
    id: string;
    name: string;
    userID: string;
    hasAccess(usrID: string): Promise<boolean>;
}
interface ICollectionType {
    findOne(properties: {
        id?: string;
    }): Promise<ICollection | undefined>
    new (collection: ICollectionGateway): ICollection
}

export type {
    ICollectionType,
    ICollection
};