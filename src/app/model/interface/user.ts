import { ICollection } from './collection';

interface IUser {
    id: string;
    name: string;
    validatePassword(password: string): Promise<boolean>;
    createCollection(name: string): Promise<ICollection>;
}

interface IUserType {
    findOne(properties: {
        id?: string;
        name?: string;
    }): Promise<IUser | undefined>;
}

export type {
    IUserType,
    IUser
};