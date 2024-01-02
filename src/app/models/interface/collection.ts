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
    sharedTo(): Promise<{ name: string, visibility: ColVisibility | undefined }[]>
    createFile(path: string, usrID: string): Promise<string>
    readFile(uuid: string): Promise<NodeJS.ReadableStream | undefined>
}
interface ICollectionType {
    findOne(properties: {
        id?: string;
        uuid?: string;
    }): Promise<ICollection | undefined>
    new (collection: ICollectionGateway): ICollection
    // Method which returns a collection which has the given file
    forFile(uuid: string): Promise<ICollection | undefined>
}

export type {
    ICollectionType,
    ICollection
};
