import bcrypt from 'bcrypt';
import {
    IUserGateway,
    UserGatewayType,
    getCollectionListArgs
} from '../gateways/interface/user';
import { ICollectionType } from './interface/collection';
import {
    ColVisibility,
    CollectionGatewayType
} from '../gateways/interface/collection';
import { UserCollectionGatewayType } from '../gateways/interface/userCollection';

interface Dependencies {
  gateways: {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
  };
  models: {
    Collection: ICollectionType;
  };
}

interface Config {
  saltRounds?: number;
}

function defineUser(dependencies: Dependencies, config?: Config) {
    const saltRounds = config?.saltRounds ?? 10;

    class User {
        private user: IUserGateway;

        private constructor(user: IUserGateway) {
            this.user = user;
        }

        public get id() {
            return this.user.id;
        }

        public get name() {
            return this.user.name;
        }

        public async delete() {
            await this.user.delete();
        }

        private static async hash(password: string) {
            const salt = await bcrypt.genSalt(saltRounds);
            return await bcrypt.hash(password, salt);
        }

        private static async compare(password: string, hash: string) {
            return await bcrypt.compare(password, hash);
        }

        public validatePassword(password: string) {
            return User.compare(password, this.user.password);
        }

        public static get dependencies() {
            return dependencies;
        }

        public get dependencies() {
            return User.dependencies;
        }

        public static async register(name: string, password: string) {
            const user = new this.dependencies.gateways.User();
            user.name = name;
            user.password = await this.hash(password);
            await user.save();
            return new User(user);
        }

        public static async findOne({ id, name }: { id?: string; name?: string }) {
            const user = await this.dependencies.gateways.User.findOne({
                where: {
                    id,
                    name
                }
            });
            if (!user) {
                return undefined;
            }
            return new User(user);
        }

        public async createCollection(name: string) {
            const collectionRef = new this.dependencies.gateways.Collection();
            collectionRef.userID = this.id;
            collectionRef.visibility = ColVisibility.PRIVATE;
            collectionRef.name = name;
            await collectionRef.save();
            return new this.dependencies.models.Collection(collectionRef);
        }

        public async getCollectionList(...args: getCollectionListArgs) {
            return this.user.getCollectionList(...args);
        }
    }
    return User;
}

export default defineUser;
