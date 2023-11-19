import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import outputType from '../../../../../../controllers/websocket/utils/outputType';
import { ICollection } from '../../../../../../app/model/interface/collection';
import {
    IDocument,
    TransformType
} from '../../../../../../app/model/interface/document';
import documentRead from '../../../../../../controllers/websocket/handlers/documents/read';

const usrInfo = [
    {
        name: 'usrName1',
        password: 'usrPassword1'
    },
    {
        name: 'usrName2',
        password: 'usrPassword2'
    }
];

const endpoint = 'DOC.READ';

const colInfo = [
    {
        name: 'colName1'
    }
];

const docInfo = [
    {
        name: 'docName1',
        text: 'docText1'
    }
];

describe('Document read', () => {
    let env: ControllerEnvironment;
    let col: ICollection;
    let doc: IDocument;
    beforeEach(async () => {
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: usrInfo
        });
        col = await env.users[0].createCollection(colInfo[0].name);
        doc = await col.createDocument(docInfo[0].name);
        await doc.transform({
            type: TransformType.WRITE,
            payload: {
                sid: 0,
                index: 0,
                text: docInfo[0].text
            }
        });
    });
    test('Document read', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await documentRead.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                name: doc.name,
                text: doc.text
            },
            acknowledge: ack
        });
    });
    test('Respond with NOT_FOUND if collection does not exist', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await documentRead.call(
            c1,
            {
                colUUID: `!${col.uuid}`,
                docName: doc.name
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'NOT_FOUND'),
            payload: {
                errors: [
                    {
                        code: 'COL_NOT_FOUND',
                        message: 'collection not found'
                    }
                ]
            },
            acknowledge: ack
        });
    });
    test('Respond with empty text if document does not exist', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        const wrongName = `!${doc.name}`;
        await documentRead.call(
            c1,
            {
                colUUID: col.uuid,
                docName: wrongName
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                name: wrongName,
                text: ''
            },
            acknowledge: ack
        });
    });
    test('Respond with FORBIDDEN if does not have permission', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[1]);
        const ack = 'abcd';
        await documentRead.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'FORBIDDEN'),
            payload: {
                errors: [
                    {
                        code: 'FORBIDDEN',
                        message: 'no access'
                    }
                ]
            },
            acknowledge: ack
        });
    });
});
