import { ColVisibility, ICollectionGateway } from '../../gateways/interface/collection';
import { IDocument } from './document';

interface ICollection {
    id: string;
    readonly uuid: string;
    name: string;
    userID: string;
    visibility: ColVisibility,
    description: string | null,
    defaultDocument: string | null,
    hasAccessLevel(level: ColVisibility, usrID?: string): Promise<boolean>;
    accessLevel(usrID?: string): Promise<ColVisibility>;
    setAccess(usrID: string, visibility: ColVisibility): Promise<void>;
    setVisibility(visibility: ColVisibility): Promise<void>;
    findDocument(name: string): Promise<IDocument | undefined>;
    createDocument(name: string): Promise<IDocument>
    delete(): Promise<void>
    readBy(usrID: string): Promise<void>
}
interface ICollectionType {
    findOne(properties: {
        id?: string;
        uuid?: string;
    }): Promise<ICollection | undefined>
    new (collection: ICollectionGateway): ICollection
}

export type {
    ICollectionType,
    ICollection
};
