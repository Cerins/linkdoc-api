// TODO const enum works weird
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import { IObjectGateway, ObjectGatewayType } from './object';

const enum ColVisibility {
    PRIVATE = 0,
    READ = 1,
    WRITE = 2,
}

interface ICollectionGateway extends IObjectGateway {
        readonly uuid: string;
        name: string;
        description: string | null;
        createdAt: Date;
        userID: string;
        visibility: ColVisibility
        defaultDocument: string | null;
        accessLevel(usrID?: string): Promise<ColVisibility>;
        sharedTo(): Promise<{ name: string, visibility: ColVisibility | undefined }[]>
}

interface CollectionGatewayType
    extends ObjectGatewayType<ICollectionGateway> {

}

export type {
    ICollectionGateway,
    CollectionGatewayType
};
export {
    ColVisibility
};