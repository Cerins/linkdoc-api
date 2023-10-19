interface IUser {
    findByUsername(username: string): Promise<{
        id: string;
        name: string;
        validatePassword(password: string): Promise<boolean>;
    } | undefined>;
}

export type {
    IUser
};