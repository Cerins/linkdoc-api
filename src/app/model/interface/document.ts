import { IDocumentGateway } from '../../gateway/interface/document';

const enum TransformType {
    WRITE = 'WRITE',
    ERASE = 'ERASE'
}

interface EraseTransform {
    type: TransformType.ERASE;
    payload: {
        index: number;
        count: number;
    }
}

interface WriteTransform {
    type: TransformType.WRITE;
    payload: {
        index: number;
        text: string;
    }
}

type Transform = EraseTransform | WriteTransform;

interface IDocument {
    id: string;
    name: string;
    text: string;
    collectionID: string;
    transform: (transform:Transform) => Promise<Transform>
}

interface IDocumentType {
    new (document: IDocumentGateway): IDocument
}

export type {
    IDocumentType,
    IDocument,
    Transform,
    EraseTransform,
    WriteTransform
};

export {
    TransformType
};
