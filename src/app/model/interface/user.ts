interface IUser {
    find(properties: {
        id?: string;
        name?: string;
    }): Promise<{
        id: string;
        name: string;
        validatePassword(password: string): Promise<boolean>;
    } | undefined>;
}

export type {
    IUser
};