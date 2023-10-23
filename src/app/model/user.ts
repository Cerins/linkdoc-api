import bcrypt from 'bcrypt';
import { IUserGateway, UserGatewayType } from '../../app/gateway/interface/user';

interface Dependencies {
  UserGateway: UserGatewayType;
}

interface Config {
  saltRounds?: number;
}

function defineUser(dependencies: Dependencies, config?: Config) {
    const saltRounds = config?.saltRounds ?? 10;

    const { UserGateway } = dependencies;

    class User {
        public name: string;
        public password: string;
        public id: string;
        private user: IUserGateway;

        private constructor(user: IUserGateway) {
            this.user = user;
            this.id = user.id;
            this.name = user.name;
            this.password = user.password;
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
            return User.compare(password, this.password);
        }

        static async register(name: string, password: string) {
            const user = new UserGateway();
            user.name = name;
            user.password = await this.hash(password);
            await user.save();
            return new User(user);
        }

        static async find({ id, name }: { id?: string, name?: string }) {
            const user = await UserGateway.findOne({
                where: {
                    id,
                    name
                }
            });
            if(!user) {
                return undefined;
            }
            return new User(user);
        }
    }
    return User;
}

export default defineUser;
