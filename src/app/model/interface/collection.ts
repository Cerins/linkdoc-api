import { ColVisibility, ICollectionGateway } from '../../gateway/interface/collection';

interface ICollection {
    id: string;
    name: string;
    userID: string;
    hasAccessLevel(level: ColVisibility, usrID?: string): Promise<boolean>;
    setAccess(usrID: string, visibility: ColVisibility): Promise<void>
    setVisibility(visibility: ColVisibility): Promise<void>
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