import { CacheGatewayType } from '../gateways/interface/cache';
import type {
    ColVisibility,
    CollectionGatewayType,
    ICollectionGateway
} from '../gateways/interface/collection';
import { CollectionOpenedGatewayType } from '../gateways/interface/collectionOpened';
import { DocumentGatewayType } from '../gateways/interface/document';
import { FileGatewayType } from '../gateways/interface/file';
import type { UserCollectionGatewayType } from '../gateways/interface/userCollection';
import { defineDocumentCache, defineTransformCache } from './document';
import type { ICollection } from './interface/collection';
import type { IDocumentType } from './interface/document';

interface Dependencies {
    gateways: {
        Collection: CollectionGatewayType
        UserCollection: UserCollectionGatewayType
        Document: DocumentGatewayType
        CollectionOpened: CollectionOpenedGatewayType
        Cache: CacheGatewayType
        File: FileGatewayType
    },
    models: {
        Document: IDocumentType
    }
}
/**
 * Defines a Collection class that represents a collection of documents.
 * @param dependencies - The dependencies required for the Collection class.
 * @returns The Collection class.
 */
export default function defineCollection(dependencies: Dependencies) {
    const documentsCache = defineDocumentCache(dependencies);
    const transformCache = defineTransformCache(dependencies);

    /**
     * Represents a collection.
     */
    class Collection implements ICollection {
        private collection: ICollectionGateway;

        // This map was chosen instead of a full fledged cache
        // Because cache would be an overkill for this use case -
        // remembering the accessLevel of a collection that was just checked
        // Since a new instance of collection is created for every request
        // the fact that this does not universally edit the cache is fine
        private usrAccessCache = new Map<string, ColVisibility>();

        private static get dependencies() {
            return dependencies;
        }

        private get dependencies() {
            return Collection.dependencies;
        }

        public constructor(collection: ICollectionGateway) {
            this.collection = collection;
        }

        public get id(){
            return this.collection.id;
        }

        public get uuid(){
            return this.collection.uuid;
        }

        public get name() {
            return this.collection.name;
        }

        public get userID() {
            return this.collection.userID.toString();
        }

        public get visibility() {
            return this.collection.visibility;
        }

        public get description() {
            return this.collection.description;
        }

        public get defaultDocument() {
            return this.collection.defaultDocument;
        }

        /**
         * Retrieves the access level of the collection for a specific user.
         * If no user ID is provided, it returns the default visibility of the collection.
         * @param usrID - The ID of the user. If not provided, the default visibility is returned.
         * @returns A Promise that resolves to the access level of the collection.
         */
        public async accessLevel(usrID?: string): Promise<ColVisibility> {
            if(usrID === undefined) {
                return this.visibility;
            }
            const cached = this.usrAccessCache.get(usrID);
            if(cached !== undefined) {
                return cached;
            }
            const al = await this.collection.accessLevel(usrID);
            this.usrAccessCache.set(usrID, al);
            return al;
        }

        /**
         * Checks if the collection has the user has at least the specified access level.
         * @param level The access level to check against.
         * @param usrID Optional.
         * The user ID to check the access level for. If not provided,
         * the default visibility is returned.
         * @returns A boolean indicating whether the user has at least the specified access level.
         */
        public async hasAccessLevel(level: ColVisibility, usrID?: string) {
            const al = await this.accessLevel(usrID);
            // Access levels are ordered by importance, so this works
            // Each new level contains the previous one + something new
            return al >= level;
        }

        private async clearVisibilityCache() {
            this.usrAccessCache.clear();
        }

        /**
         * Sets the visibility of the collection.
         * @param visibility The visibility to set.
         * @returns A promise that resolves when the visibility is set.
         */
        public async setVisibility(visibility: ColVisibility) {
            this.collection.visibility = visibility;
            await Promise.all(
                [
                    // Have to clear the cache, so the accessLevel method would
                    // not use the old value
                    this.clearVisibilityCache(),
                    this.collection.save()
                ]
            );
        }

        /**
         * Sets the access level for a user in the collection.
         *
         * @param usrID - The ID of the user.
         * @param visibility - The visibility level to set for the user.
         * @returns A promise that resolves when the access level is set.
         */
        public async setAccess(usrID: string, visibility: ColVisibility) {
            // TODO currently required two queries, which is a downside
            // theoretical optimization would be using upsert
            // but currently this is not needed
            // when db read/writes becomes crucial, dwell deeper in this issue

            // First find if there is already set access level for the user
            let usrCol = await this.dependencies.gateways.UserCollection.findOne({
                where: {
                    userID: usrID,
                    collectionID: this.id
                }
            });
            // If not then create a new one through a gateway
            if(usrCol === undefined) {
                usrCol = new this.dependencies.gateways.UserCollection();
                usrCol.collectionID = this.id;
                usrCol.userID = usrID;
            }
            // Set the new access level
            usrCol.visibility = visibility;
            // Save the changes and clear the cache
            await Promise.all(
                [
                    usrCol.save(),
                    this.clearVisibilityCache()
                ]
            );
        }

        /**
         * Deletes the collection.
         * @returns A promise that resolves when the collection is deleted.
         */
        public async delete(){
            // This will cascade delete all the documents
            await this.collection.delete();
        }

        /**
         * Set the last time the collection was opened by the user.
         * @param usrID - The ID of the user.
         */
        public async readBy(usrID: string) {
            const { CollectionOpened } = this.dependencies.gateways;
            let co = await CollectionOpened.findOne({
                where: {
                    collectionID: this.id,
                    userID: usrID
                }
            });
            // TODO also unpleasant that there are 2 queries
            if(co === undefined) {
                co = new CollectionOpened();
                co.userID = usrID;
                co.collectionID = this.id;
            }
            co.opened = new Date();
            await co.save();
        }

        public static async findOne(properties: {
            id?: string
            uuid?: string
        }) {
            const item = await this.dependencies.gateways.Collection.findOne({
                where: {
                    id: properties.id,
                    uuid: properties.uuid
                }
            });
            if(item === undefined) {return undefined;}
            return new Collection(item);
        }


        /**
         * Finds a document by name, which registered in the collection.
         * The documents are found through a cache.
         * @param name - The name of the document to find.
         * @returns The found document, or undefined if not found.
         */
        public async findDocument(name: string) {
            const item = await documentsCache.get(`${this.id}:${name}`);
            if(item === null) {return undefined;}
            return new this.dependencies.models.Document(item as any);
        }

        /**
         * Creates a new document in the collection.
         * @param name - The name of the document.
         * @returns The newly created document.
         */
        public async createDocument(name: string) {
            const item = new this.dependencies.gateways.Document();
            item.collectionID = this.id;
            item.name = name;
            item.text = '';
            await item.save();
            return new this.dependencies.models.Document(item);
        }

        /**
         * Retrieves the list of users that were granted access to the collection.
         * @returns A promise that resolves with the sharedTo information.
         */
        public async sharedTo() {
            return this.collection.sharedTo();
        }

        /**
         * Creates a file in the collection.
         * @param path - The path, where the server stored the file.
         * @param usrID - The user ID.
         * @returns The UUID of the created file.
         */
        public async createFile(path: string, usrID: string) {
            const { File } = this.dependencies.gateways;
            const file = await File.register(path, {
                collectionID: this.id,
                usrID
            });
            return file.uuid;
        }

        /**
         * Reads a file with the given public id which belongs to the collection.
         * @param uuid - The UUID of the file or in other words the public id to read.
         * @returns A readable stream of the file content,
         * or undefined if the file is not found or does not belong to the collection.
         */
        public async readFile(uuid: string) {
            const { File } = this.dependencies.gateways;
            const file = await File.find(uuid);
            if(file === undefined) {return undefined;}
            if(file.collectionID !== this.id) {return undefined;}
            return file.stream();
        }

        /**
         * Retrieves the collection which contains the file with the given UUID.
         * @param uuid - The UUID of the file.
         * @returns The collection object if found, otherwise undefined.
         */
        public static async forFile(uuid: string) {
            const { File } = this.dependencies.gateways;
            const file = await File.find(uuid);
            if(file === undefined) {return undefined;}
            const collection = await this.findOne({
                id: file.collectionID
            });
            if(collection === undefined) {return undefined;}
            return collection;
        }
    }
    return Collection;
}
