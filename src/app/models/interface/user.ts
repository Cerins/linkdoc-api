import {
    getCollectionListArgs,
    getCollectionListReturn
} from '../../gateways/interface/user';
import { ICollection } from './collection';


interface IUser {
    id: string;
    name: string;
    validatePassword(password: string): Promise<boolean>;
    createCollection(name: string): Promise<ICollection>;
    getCollectionList(...args: getCollectionListArgs): Promise<getCollectionListReturn>
    delete(): Promise<void>
}

interface IUserType {
    findOne(properties: {
        id?: string;
        name?: string;
    }): Promise<IUser | undefined>;
    register(name: string, password:string): Promise<IUser>
}

export type {
    IUserType,
    IUser
};
