
interface IFileGateway {
    uuid: string;
    collectionID: string;
    path: string;
    usrID: string;
    // A method which streams the file content
    stream(): NodeJS.ReadableStream;
}

interface FileGatewayType {
    register(path: string, {
        collectionID,
        usrID
    }: {
        collectionID: string;
        usrID: string;
    }): Promise<IFileGateway>;
    find(uuid: string): Promise<IFileGateway | undefined>;
}

export type {
    IFileGateway,
    FileGatewayType
};