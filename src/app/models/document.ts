import { JSONValue } from '../../utils/json';
import { CacheGatewayType } from '../gateways/interface/cache';
import {
    IDocumentGateway,
    DocumentGatewayType
} from '../gateways/interface/document';
import {
    EraseTransform,
    IDocument,
    Transform,
    TransformType,
    WriteTransform
} from './interface/document';

interface Dependencies {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}


// Create a singleton
export function defineDocumentCache(dependencies: {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}) {
    const { Cache, Document } = dependencies.gateways;
    return new Cache({
        namespace: 'documents',
        timeout: 1000 * 60,
        resolver: async (name) => {
            const split = name.split(':');
            const collectionID = split[0];
            const docName = split[1];
            const item = await Document.findOne({
                where: {
                    name: docName,
                    collectionID
                }
            });
            if (item === undefined) {
                return null;
            }
            return {
                id: item.id,
                collectionID: item.collectionID,
                name: item.name,
                text: item.text
            };
        },
        backuper: async (name, value: any | null) => {
            if(value === null) {return;}
            const document = new Document();
            document.link(value);
            await document.save();
        }
    });
}

export function defineUserCache(dependencies: {
    gateways: {
        Cache: CacheGatewayType;
    }
}) {
    const { Cache } = dependencies.gateways;
    return new Cache({
        namespace: 'documents:users',
        timeout: 1000 * 60 * 60,
        resolver: async (name) => {
            return {};
        }
    });
}


export function defineTransformCache(dependencies: {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}) {
    const { Cache } = dependencies.gateways;
    return new Cache({
        namespace: 'documents:transforms',
        timeout: 1000 * 60 * 60,
        resolver: async (name) => {
            return [];
        }
    });
}

export default function defineDocument(dependencies: Dependencies) {
    const documentsCache = defineDocumentCache(dependencies);
    const transformsCache = defineTransformCache(dependencies);
    // const usersCache = defineUserCache(dependencies);
    class Document implements IDocument {
        private document: IDocumentGateway;

        public constructor(document: IDocumentGateway) {
            this.document = document;
        }

        public get id() {
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
        public async revision() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as unknown as Transform[];
            return pastTransforms.length;
        }
        public async setOperations(operations: any[]) {
            await transformsCache.set(
                `${this.document.collectionID}:${this.document.name}`, operations
            );
        }
        public async getOperations() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as any[];
            return pastTransforms;
        }
        public async sid() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as unknown as Transform[];
            if (pastTransforms.length === 0) {
                return 1;
            }
            // Find max sid
            const max = pastTransforms.reduce((a, b) => {
                return a.payload.sid > b.payload.sid ? a : b;
            });
            return max.payload.sid + 1;
        }
        public async setText(txt: string) {
            this.document.text = txt;
            const saveDoc = async () => {
                const {
                    collectionID,
                    id,
                    name,
                    text
                } = this.document;
                await documentsCache.set(`${collectionID}:${name}`, {
                    id,
                    collectionID,
                    name,
                    text
                });
            };
            await saveDoc();
        }
        protected async ot(transform: Transform) {
            const { collectionID, name } = this.document;
            let pastTransforms
                        =  (await transformsCache
                            .get(
                                `${collectionID}:${name}`
                            )) as unknown as Transform[];


            // Currently only support these types
            if (transform.type === TransformType.WRITE || transform.type === TransformType.ERASE) {
                pastTransforms.forEach((other) => {
                    // Skip processing for transforms that happened after the transform
                    // TODO = is here to make sure that old tests do not break,
                    // but it might be better behavior if this is removed
                    // this needs to be experimented with
                    if (other.payload.sid <= transform.payload.sid) {
                        return;
                    }
                    if(
                        other.type === TransformType.WRITE
                        && other.payload.index <= transform.payload.index
                        && other.payload.sid >= transform.payload.sid
                    ) {
                        transform.payload.index += other.payload.text.length;
                    }
                    if(
                        other.type === TransformType.ERASE
                        && other.payload.index < transform.payload.index
                        && other.payload.sid >= transform.payload.sid
                    ) {
                        transform.payload.index -= other.payload.count;
                    }


                });
            }

            pastTransforms.push(transform);
            // Only needed to discard old items
            pastTransforms.sort((a, b) => a.payload.sid - b.payload.sid ? 1 : -1);
            pastTransforms = pastTransforms.slice(0, 101);
            await transformsCache.set(
                `${collectionID}:${name}`, pastTransforms as unknown as JSONValue
            );
            return transform;
        }
        public async transform(transformRaw: Transform) {
            const saveDoc = async () => {
                const {
                    collectionID,
                    id,
                    name,
                    text
                } = this.document;
                await documentsCache.set(`${collectionID}:${name}`, {
                    id,
                    collectionID,
                    name,
                    text
                });
            };
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
                await saveDoc();
            };
            const deleteTxt = async(transform: EraseTransform)=>{
                const { index, count }  = transform.payload;
                const s = 0;
                const l = index;
                const r = l + count;
                const e = this.document.text.length;
                const newTxt = this.document.text.slice(s, l) + this.document.text.slice(r, e);
                this.document.text = newTxt;
                await saveDoc();
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
