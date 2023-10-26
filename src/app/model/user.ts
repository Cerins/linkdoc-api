import bcrypt from 'bcrypt';
import {
    IUserGateway,
    UserGatewayType
} from '../../app/gateway/interface/user';
import { ICollectionType } from './interface/collection';
import {
    ColVisibility,
    CollectionGatewayType
} from '../gateway/interface/collection';
import { UserCollectionGatewayType } from '../gateway/interface/userCollection';

interface Dependencies {
  gateway: {
    User: UserGatewayType;
    Collection: CollectionGatewayType;
    UserCollection: UserCollectionGatewayType;
  };
  model: {
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

        validatePassword(password: string) {
            return User.compare(password, this.user.password);
        }

        public static get dependencies() {
            return dependencies;
        }

        public get dependencies() {
            return User.dependencies;
        }

        static async register(name: string, password: string) {
            const user = new this.dependencies.gateway.User();
            user.name = name;
            user.password = await this.hash(password);
            await user.save();
            return new User(user);
        }

        static async findOne({ id, name }: { id?: string; name?: string }) {
            const user = await this.dependencies.gateway.User.findOne({
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

        async createCollection(name: string) {
            const collectionRef = new this.dependencies.gateway.Collection();
            collectionRef.userID = this.id;
            collectionRef.visibility = ColVisibility.PRIVATE;
            collectionRef.name = name;
            await collectionRef.save();
            console.log(this.dependencies);
            return new this.dependencies.model.Collection(collectionRef);
        }
    }
    return User;
}

export default defineUser;
