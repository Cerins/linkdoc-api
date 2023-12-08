import { IObjectGateway, ObjectGatewayType } from './object';

interface IDocumentGateway extends IObjectGateway {
  name: string;
  text: string;
  collectionID: string;
  link(value: {
    id: string;
    name: string;
    text: string;
    collectionID: string;
  }): void;
}

interface DocumentGatewayType extends ObjectGatewayType<IDocumentGateway> {}

export { IDocumentGateway, DocumentGatewayType };
