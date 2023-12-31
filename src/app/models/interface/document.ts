import { IDocumentGateway } from '../../gateways/interface/document';

const enum TransformType {
    WRITE = 'WRITE',
    ERASE = 'ERASE'
}

// sid is sort id, a way to sort transform events based on time
interface EraseTransform {
    type: TransformType.ERASE;
    payload: {
        index: number;
        sid: number;
        count: number;
    }
}

interface WriteTransform {
    type: TransformType.WRITE;
    payload: {
        index: number;
        sid: number;
        text: string;
    }
}

type Transform = EraseTransform | WriteTransform;

interface IDocument {
    id: string;
    name: string;
    text: string;
    collectionID: string;
    revision(): Promise<number>;
    transformRaw(
        operation: unknown[],
        selection: {
            ranges: {
                anchor: number;
                head: number;
            }[]
        } | null,
        revision: number
    ): Promise<any>
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
