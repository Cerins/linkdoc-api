import { ColVisibility } from './collection';
import { IObjectGateway, ObjectGatewayType } from './object';

interface IDocumentGateway extends IObjectGateway {
    name: string;
    text: string;
    collectionID: string;
    hasAccessLevel(usrID: string, visiblity: ColVisibility): Promise<boolean>;
}

interface DocumentGatewayType
    extends ObjectGatewayType<IDocumentGateway> {}


export {
    IDocumentGateway,
    DocumentGatewayType
};