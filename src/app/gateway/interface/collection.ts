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
        name: string;
        description: string | null;
        createdAt: Date;
        userID: string;
        visibility: ColVisibility
        hasAccessLevel(level: ColVisibility, usrID?: string): Promise<boolean>;
}

interface CollectionGatewayType
    extends ObjectGatewayType<ICollectionGateway> {

}

export {
    ICollectionGateway,
    CollectionGatewayType,
    ColVisibility
};
