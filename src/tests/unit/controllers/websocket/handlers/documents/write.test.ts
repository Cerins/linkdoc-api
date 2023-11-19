import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import outputType from '../../../../../../controllers/websocket/utils/outputType';
import { ICollection } from '../../../../../../app/models/interface/collection';
import {
    IDocument,
    TransformType
} from '../../../../../../app/models/interface/document';
import documentWrite from '../../../../../../controllers/websocket/handlers/documents/write';
import docRoom from '../../../../../../controllers/websocket/utils/documentRoom';
import { ColVisibility } from '../../../../../../app/gateways/interface/collection';

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

const endpoint = 'DOC.WRITE';

const colInfo = [
    {
        name: 'colName1'
    }
];

const docInfo = [
    {
        name: 'docName1',
        text: 'docText1'
    },
    {
        name: 'docName2',
        text: ''
    }
];

describe('Document write', () => {
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
    test('Write to the document', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        const prefix = '123';
        const payload = {
            index: 0,
            sid: 0,
            text: prefix
        };
        c1.join(docRoom(col.uuid, doc.name));
        await documentWrite.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name,
                payload
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                colUUID: col.uuid,
                docName: doc.name,
                transform: {
                    type: TransformType.WRITE,
                    payload: payload
                }

            },
            acknowledge: ack
        });
        const changedDoc = await col.findDocument(doc.name);
        expect(changedDoc?.text).toBe(`${prefix}${docInfo[0].text}`);
    });
    test('Write to the document without a response if not in the room', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        const prefix = '123';
        const payload = {
            index: 0,
            sid: 0,
            text: prefix
        };
        // c1.join(docRoom(col.uuid, doc.name));
        await documentWrite.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name,
                payload
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledTimes(0);
        const changedDoc = await col.findDocument(doc.name);
        expect(changedDoc?.text).toBe(`${prefix}${docInfo[0].text}`);
    });
    test('Create a document on write if does not exist', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        const prefix = '123';
        const payload = {
            index: 0,
            sid: 0,
            text: prefix
        };
        c1.join(docRoom(col.uuid, docInfo[1].name));
        await documentWrite.call(
            c1,
            {
                colUUID: col.uuid,
                docName: docInfo[1].name,
                payload
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                colUUID: col.uuid,
                docName: docInfo[1].name,
                transform: {
                    type: TransformType.WRITE,
                    payload: payload
                }
            },
            acknowledge: ack
        });
        const changedDoc = await col.findDocument(docInfo[1].name);
        expect(changedDoc).toBeDefined();
        expect(changedDoc?.text).toBe(`${prefix}`);
    });
    test('Respond with FORBIDDEN if does not have permission', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[1]);
        const ack = 'abcd';
        const prefix = '123';
        const payload = {
            index: 0,
            sid: 0,
            text: prefix
        };
        await documentWrite.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name,
                payload
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
    test('Respond with FORBIDDEN if has only a read permission', async () => {
        await col.setVisibility(ColVisibility.READ);
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[1]);
        const ack = 'abcd';
        const prefix = '123';
        const payload = {
            index: 0,
            sid: 0,
            text: prefix
        };
        // c1.join(docRoom(col.uuid, doc.name));
        await documentWrite.call(
            c1,
            {
                colUUID: col.uuid,
                docName: doc.name,
                payload
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
