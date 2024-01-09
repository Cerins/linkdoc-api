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

/**
 * Represents a DocumentCache class that provides caching functionality for documents.
 * Allows to retrieve a cache singleton instance.
 */
export class DocumentCache {
    private static cache: ICacheGateway | null = null;

    private constructor() {
    }

    /**
     * Retrieves the cache instance.
     * If the cache instance does not exist, it creates a new one using the provided dependencies.
     * @param dependencies - The dependencies required to create the cache instance.
     * @returns The cache instance.
     */
    public static getCache(
        dependencies: {
            gateways: {
                Cache: CacheGatewayType;
                Document: DocumentGatewayType;
            };
        }
    ) {
        if (this.cache !== null) {
            return this.cache;
        }
        const { Cache, Document } = dependencies.gateways;
        this.cache = new Cache({
            namespace: 'documents',
            timeout: 1000 * 60,
            resolver: async (name) => {

                const split = name.split(':');
                // The local key is made up from the collectionID and the document name
                const collectionID = split[0];
                const docName = split[1];
                // Find the document in the database
                const item = await Document.findOne({
                    where: {
                        name: docName,
                        collectionID
                    }
                });
                if (item === undefined) {
                    return null;
                }
                // Good find
                return {
                    id: item.id,
                    collectionID: item.collectionID,
                    name: item.name,
                    text: item.text
                };
            },
            backuper: async (name, value: any | null) => {
                // Backup the document in the database
                // If the cache is about to be deleted
                if(value === null) {return;}
                const document = new Document();
                document.link(value);
                await document.save();
            }
        });
        return this.cache;
    }
}


/**
 * Represents a TransformCache class that provides a cache for document transforms.
 * Allows to retrieve a cache singleton instance.
 */
export class TransformCache {
    private static cache: ICacheGateway | null = null;
    private constructor() {
    }

    /**
     * Retrieves the cache instance for document transforms.
     * If the cache instance does not exist, it creates a new one.
     * @param dependencies - The dependencies required to create the cache instance.
     * @returns The cache instance for document transforms.
     */
    public static getCache(
        dependencies: {
            gateways: {
                Cache: CacheGatewayType;
            };
        }
    ) {
        if (this.cache !== null) {
            return this.cache;
        }
        this.cache = new dependencies.gateways.Cache({
            namespace: 'documents:transforms',
            timeout: 1000 * 60 * 60,
            // By default, the document does not have any transforms
            resolver: async (name) => {
                return [];
            }
            // And also there is nothing to backup
            // The transform data is unimportant and can be lost
            // It only matters for the session
        });
        return this.cache;
    }
}

export default function defineDocument(dependencies: Dependencies) {
    const documentsCache = DocumentCache.getCache(dependencies);
    const transformsCache = TransformCache.getCache(dependencies);
    /**
     * Represents a document.
     */
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

        /**
         * Returns the current document version based on operation history.
         * @returns The current document version.
         */
        public async revision() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as unknown as Transform[];
            return pastTransforms.length;
        }
        /**
         * Allow to set the past operations of the document
         * @param operations - The past edit operations of the document.
         */
        private async setOperations(operations: any[]) {
            await transformsCache.set(
                `${this.document.collectionID}:${this.document.name}`, operations
            );
        }
        /**
         * Returns the past operations of the document.
         * @returns The past edit operations of the document.
         */
        private async getOperations() {
            const pastTransforms = (await transformsCache.get(
                `${this.document.collectionID}:${this.document.name}`
            )) as any[];
            return pastTransforms;
        }
        /**
         * Allows to overwrite the document text. First in the cache, then in the database.
         * @param txt - The text to set.
         */
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
        /**
         * Transforms the document with the provided operation.
         * @returns The operation`
         * ( in other words operation which takes into account new changes in the document).
         * with the meta data.
         */
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
            // Take the values from the cache and
            // Change them to the style of the library
            const past = (await this.getOperations()).map(
                (op)=>{
                    return new WrappedOperation(
                        TextOperation.fromJSON(op.operation),
                        op.meta && Selection.fromJSON(op.meta)
                    );
                }
            );
            // Use the library to create a transformator
            const server = new Server(this.text, past);

            // Wrap the operation and the selection
            const wrapped = new WrappedOperation(
                TextOperation.fromJSON(operation),
                selection && Selection.fromJSON(selection)
            );
            // Change the document text and the received operation
            const wrappedPrime = server.receiveOperation(revision, wrapped);
            // Update the document text
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
