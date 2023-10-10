import { IUserGateway } from '../interface/user';

class User implements IUserGateway {
    private static Users: Record<
    string,
    {
      id: string;
      name: string;
      password: string;
    }
  > = {};

    #id?: undefined | string;

    #name?: undefined | string;

    #password?: undefined | string;

    public get id(): string {
        if (!this.#id) {
            throw new Error('[id] undefined');
        }
        return this.#id;
    }

    public get name(): string {
        if (!this.#name) {
            throw new Error('[name] undefined');
        }
        return this.#name;
    }

    public set name(value: string) {
        this.#name = value;
    }

    public get password(): string {
        if (!this.#password) {
            throw new Error('[password] undefined');
        }
        return this.#password;
    }

    public set password(value: string) {
        this.#password = value;
    }

    public link(properties: {
    id: string;
    name: string;
    password: string;
  }): void {
        this.#id = properties.id;
        this.#name = properties.name;
        this.#password = properties.password;
    }

    public async save(): Promise<void> {
        if (this.#id === undefined) {
            this.#id = Math.random().toString(32).substring(2);
        }
        User.Users[this.id] = {
            id: this.id,
            name: this.name,
            password: this.password
        };
    }

    public async delete(): Promise<void> {
        delete User.Users[this.id];
    }

    public static async findAll(query?: {
    where: {
      name: string;
    };
  }) {
        return Object.values(this.Users)
            .map((user) => {
                const instance = new User();
                instance.link(user);
                return instance;
            })
            .filter((user) => {
                const desiredName = query?.where.name;
                if (!desiredName) {
                    return true;
                }
                return user.name === desiredName;
            });
    }
    public static async findOne(query?: {
    where: {
      name: string;
    };
  }) {
        const users = await this.findAll(query);
        if (users.length === 0) {
            return undefined;
        }
        return users[0];
    }
}

export default User;
