import { IDocumentGateway } from '../../gateway/interface/document';
interface IDocument {
    id: string;
    name: string;
    text: string;
    collectionID: string;
}

interface IDocumentType {
    new (document: IDocumentGateway): IDocument
}

export type {
    IDocumentType,
    IDocument
};
