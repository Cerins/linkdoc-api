interface IUser {
    id: string;
    name: string;
    validatePassword(password: string): Promise<boolean>;
}

interface IUserType {
    find(properties: {
        id?: string;
        name?: string;
    }): Promise<IUser | undefined>;
}

export type {
    IUserType,
    IUser
};