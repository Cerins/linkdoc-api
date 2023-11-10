
import {
    IDocumentGateway,
    DocumentGatewayType
} from '../gateway/interface/document';
import {
    EraseTransform,
    IDocument,
    Transform,
    TransformType,
    WriteTransform
} from './interface/document';

interface Dependencies {
    gateways: {
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
        protected async ot(transform: Transform) {
            // TODO write this algorithm
            return transform;
        }
        public async transform(transformRaw: Transform) {
            const writeTxt = async(transform: WriteTransform)=>{
                const { index, text } = transform.payload;
                const s = 0;
                const l = index;
                const r = index;
                const e = this.document.text.length;
                const newTxt = this.document.text.slice(s, l)
                                + text
                                + this.document.text.slice(r, e);
                this.document.text = newTxt;
                await this.document.save();
            };
            const deleteTxt = async(transform: EraseTransform)=>{
                const { index, count }  = transform.payload;
                const s = 0;
                const l = index;
                const r = l + count;
                const e = this.document.text.length;
                const newTxt = this.document.text.slice(s, l) + this.document.text.slice(r, e);
                this.document.text = newTxt;
                await this.document.save();
            };
            const transform = await this.ot(transformRaw);
            switch(transform.type){
            case TransformType.WRITE:
                await writeTxt(transform);
                break;
            case TransformType.ERASE:
                await deleteTxt(transform);
                break;
            default:
                throw new Error('Unknown transform');
            }

            return transform;
        }

    }
    return Document;
}
