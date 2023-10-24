
import { Knex } from 'knex';
import { IUserGateway } from '../interface/user';

interface Dependencies {
    db: Knex
}

export default function defineUserGateway(
    dependencies: Dependencies
) {
    const { db } = dependencies;
    class User implements IUserGateway {
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

        public async getCollections() {
            return [];
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

        public async delete() {
            if(this.#id === undefined) {
                throw new Error('Cannot delete user without id');
            }
            await db('User').where({
                usrId: this.id
            }).delete();
        }

        public async save() {
            if(this.#id === undefined) {
                const id = await db('User').insert({
                    usrName: this.name,
                    usrPassword: this.password
                });
                this.#id = id[0].toString();
            } else {
                await db('User').where({
                    usrId: this.id
                }).update({
                    usrName: this.name,
                    usrPassword: this.password
                });
            }
        }
        public static async findAll(queryPrams?: {
            where: {
                name?: string;
                id?: string;
            }
        }) {
            // Select all users that match the query
            const name = queryPrams?.where.name;
            const id = queryPrams?.where.id;
            const query = db('User');
            if(name) {
                query.where('usrName', name);
            }
            if(id) {
                query.where('usrID', id);
            }
            // Select only needed fields with aliases
            query.select('usrID as id', 'usrName as name', 'usrPassword as password');
            const users = await query;
            return users.map((user) => {
                const newUser = new User();
                newUser.link({
                    ...user,
                    id: user.id.toString()
                });
                return newUser;
            });
        }
        public static async findOne(queryPrams?: {
            where: {
                id?: string;
                name?: string;
            }
        }) {
            const users = await this.findAll(queryPrams);
            if(users.length === 0) {
                return undefined;
            }
            return users[0];
        }
    }

    return User;
}