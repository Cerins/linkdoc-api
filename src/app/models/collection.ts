import { CacheGatewayType } from '../gateways/interface/cache';
import type {
    ColVisibility,
    CollectionGatewayType,
    ICollectionGateway
} from '../gateways/interface/collection';
import { CollectionOpenedGatewayType } from '../gateways/interface/collectionOpened';
import { DocumentGatewayType } from '../gateways/interface/document';
import type { UserCollectionGatewayType } from '../gateways/interface/userCollection';
import { defineDocumentCache } from './document';
import type { ICollection } from './interface/collection';
import type { IDocumentType } from './interface/document';

interface Dependencies {
    gateways: {
        Collection: CollectionGatewayType
        UserCollection: UserCollectionGatewayType
        Document: DocumentGatewayType
        CollectionOpened: CollectionOpenedGatewayType
        Cache: CacheGatewayType
    },
    models: {
        Document: IDocumentType
    }
}
export default function defineCollection(dependencies: Dependencies) {
    const documentsCache = defineDocumentCache(dependencies);

    class Collection implements ICollection {
        private collection: ICollectionGateway;

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

        public async hasAccessLevel(level: ColVisibility, usrID?: string) {
            return this.collection.hasAccessLevel(level, usrID);
        }

        public async setVisibility(visibility: ColVisibility) {
            this.collection.visibility = visibility;
            await this.collection.save();
        }

        public async setAccess(usrID: string, visibility: ColVisibility) {
            // TODO currently required two queries, which is a downside
            // theoretical optimization would be using upsert
            // but currently this is not needed
            // when db read/writes becomes crucial dwell deeper in this issue

            // One upside of using gateways instead of directly sql connection abstraction
            // is that i can use specific sql syntax in one gateway
            // and other sql syntax in other gateway
            // and the model will be none the wiser
            // quite the wonderful plug and play architecture
            let usrCol = await this.dependencies.gateways.UserCollection.findOne({
                where: {
                    userID: usrID,
                    collectionID: this.id
                }
            });
            if(usrCol === undefined) {
                usrCol = new this.dependencies.gateways.UserCollection();
                usrCol.collectionID = this.id;
                usrCol.userID = usrID;
            }
            usrCol.visibility = visibility;
            await usrCol.save();
        }

        public async delete(){
            await this.collection.delete();
        }

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

        public async findDocument(name: string) {
            const item = await documentsCache.get(`${this.id}:${name}`);
            if(item === null) {return undefined;}
            return new this.dependencies.models.Document(item as any);
        }
        public async createDocument(name: string) {
            const item = new this.dependencies.gateways.Document();
            item.collectionID = this.id;
            item.name = name;
            item.text = '';
            await item.save();
            return new this.dependencies.models.Document(item);
        }

    }
    return Collection;
}
