import {
    ColVisibility,
    CollectionGatewayType,
    ICollectionGateway
} from '../gateway/interface/collection';
import { UserCollectionGatewayType } from '../gateway/interface/userCollection';
import { ICollection } from './interface/collection';

interface Dependencies {
    gateway: {
        Collection: CollectionGatewayType
        UserCollection: UserCollectionGatewayType
    }
}
export default function defineCollection(dependencies: Dependencies) {
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

        public async hasAccess(usrID: string) {
            return this.collection.hasAccess(usrID);
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
            let usrCol = await this.dependencies.gateway.UserCollection.findOne({
                where: {
                    userID: usrID,
                    collectionID: this.id
                }
            });
            if(usrCol === undefined) {
                usrCol = new this.dependencies.gateway.UserCollection();
                usrCol.collectionID = this.id;
                usrCol.userID = usrID;
            }
            usrCol.visibility = visibility;
            await usrCol.save();
        }

        public static async findOne(properties: {
            id?: string
        }) {
            const item = await this.dependencies.gateway.Collection.findOne({
                where: {
                    id: properties.id
                }
            });
            if(item === undefined) {return undefined;}
            return new Collection(item);
        }
    }
    return Collection;
}