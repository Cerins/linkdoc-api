import { Knex } from 'knex';
import defineBaseGateway from './base';
import { IDocumentGateway } from '../interface/document';

interface Dependencies {
    db: Knex;
}

export default function defineDocumentGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<IDocumentGateway>(
        {
            db
        },
        {
            tableName: 'Document',
            physicalNames: {
                id: 'docID',
                name: 'docName',
                text: 'docText',
                collectionID: 'doc_colID'
            }
        }
    );
    class Document extends Base implements IDocumentGateway {
    }
    return Document;
}
