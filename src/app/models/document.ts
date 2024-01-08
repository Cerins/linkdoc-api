import TextOperation from '../../utils/ot/text-operation';
import WrappedOperation from '../../utils/ot/wrapped-operation';
import Selection from '../../utils/ot/selection';
import Server from '../../utils/ot/server';
import { CacheGatewayType, ICacheGateway } from '../gateways/interface/cache';
import {
    IDocumentGateway,
    DocumentGatewayType
} from '../gateways/interface/document';
import {
    IDocument,
    Transform
} from './interface/document';

interface Dependencies {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}

let dc: ICacheGateway | null = null;
// Create a singleton
export function defineDocumentCache(dependencies: {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}) {
    const { Cache, Document } = dependencies.gateways;
    if(dc !== null) {
        return dc;
    }
    dc = new Cache({
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
    return dc;

}

let tc: ICacheGateway | null = null;

export function defineTransformCache(dependencies: {
  gateways: {
    Document: DocumentGatewayType;
    Cache: CacheGatewayType;
  };
}) {
    const { Cache } = dependencies.gateways;
    if(tc !== null) {
        return tc;
    }
    tc = new Cache({
        namespace: 'documents:transforms',
        timeout: 1000 * 60 * 60,
        resolver: async (name) => {
            return [];
        }
    });
    return tc;

}

export default function defineDocument(dependencies: Dependencies) {
    const documentsCache = defineDocumentCache(dependencies);
    const transformsCache = defineTransformCache(dependencies);
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
        private async setOperations(operations: any[]) {
            await transformsCache.set(
                `${this.document.collectionID}:${this.document.name}`, operations
            );
        }
        private async getOperations() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as any[];
            return pastTransforms;
        }
        private async setText(txt: string) {
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
        public async transformRaw(
            operation: unknown[],
            selection: {
                ranges: {
                    anchor: number;
                    head: number;
                }[]
            } | null,
            revision: number
        ) {
            // TODO Potential redis usage problems
            // Look here if it a problem
            const past = (await this.getOperations()).map(
                (op)=>{
                    return new WrappedOperation(
                        TextOperation.fromJSON(op.operation),
                        op.meta && Selection.fromJSON(op.meta)
                    );
                }
            );
            const server = new Server(this.text, past);

            const wrapped = new WrappedOperation(
                TextOperation.fromJSON(operation),
                selection && Selection.fromJSON(selection)
            );
            const wrappedPrime = server.receiveOperation(revision, wrapped);
            await this.setText(server.document);
            // Redis And here also
            await this.setOperations(server.operations.map((wo: any)=>{
                return {
                    operation: wo.wrapped.toJSON(),
                    meta: wo.meta
                };
            }));
            return {
                operation: wrappedPrime.wrapped.toJSON(),
                meta: wrappedPrime.meta
            };
        }
    }
    return Document;
}
