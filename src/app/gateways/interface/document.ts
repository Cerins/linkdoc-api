import { IObjectGateway, ObjectGatewayType } from './object';

interface IDocumentGateway extends IObjectGateway {
    name: string;
    text: string;
    collectionID: string;
}

interface DocumentGatewayType
    extends ObjectGatewayType<IDocumentGateway> {}


export {
    IDocumentGateway,
    DocumentGatewayType
};
