
import {
    IDocumentGateway,
    DocumentGatewayType
} from '../gateway/interface/document';
import { IDocument } from './interface/document';

interface Dependencies {
    gateway: {
        Document: DocumentGatewayType
    }
}
export default function defineDocument(dependencies: Dependencies) {
    class Document implements IDocument {
        private document: IDocumentGateway;

        public constructor(document: IDocumentGateway) {
            this.document = document;
        }

        public get id(){
            return this.document.id;
        }

        public get name() {
            return this.document.name;
        }

        public get text() {
            return this.document.text;
        }

        public get collectionID() {
            return this.document.collectionID;
        }
    }
    return Document;
}
