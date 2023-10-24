interface ICollection {
    find(properties: {
        id?: string;

    }): Promise<{
        id: string;
        name: string;
        usrID: string;
        hasAccess(usrID: string): Promise<boolean>;
    }>
}

export type {
    ICollection
};