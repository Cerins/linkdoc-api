import { CollectionGatewayType, ICollectionGateway } from '../gateway/interface/collection';
import { ICollection } from './interface/collection';

interface Dependencies {
    Collection: CollectionGatewayType
}
export default function defineCollection(dependencies: Dependencies) {
    const { Collection: CollectionGateway } = dependencies;

    class Collection implements ICollection {
        private collection: ICollectionGateway;

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

        public static async findOne(properties: {
            id?: string
        }) {
            const item = await CollectionGateway.findOne({
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