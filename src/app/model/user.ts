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

        static async register(name: string, password: string) {
            const user = new UserGateway();
            user.name = name;
            user.password = await this.hash(password);
            await user.save();
            return new User(user);
        }

        static async login(name: string, password: string) {
            const user = await UserGateway.findOne({
                where: {
                    name
                }
            });
            if (!user) {
                throw new Error('USER NOT FOUND');
            }
            const isPasswordCorrect = await this.compare(password, user.password);
            if (!isPasswordCorrect) {
                throw new Error('BAD PASSWORD');
            }
            return new User(user);
        }
    }
    return User;
}

export default defineUser;
