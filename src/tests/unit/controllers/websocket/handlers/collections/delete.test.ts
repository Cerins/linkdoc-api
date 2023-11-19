import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import outputType from '../../../../../../controllers/websocket/utils/outputType';
import { ICollection } from '../../../../../../app/models/interface/collection';
import collectionDelete from '../../../../../../controllers/websocket/handlers/collections/delete';

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

const endpoint = 'COL.DELETE';

const colInfo = [
    {
        name: 'colName1'
    }
];

describe('collection create', () => {
    let env: ControllerEnvironment;
    let col: ICollection;
    beforeEach(async () => {
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: usrInfo
        });
        col = await env.users[0].createCollection(colInfo[0].name);
    });
    test('Delete collection', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionDelete.call(c1, {
            uuid: col.uuid
        }, endpoint, ack);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        const collection = await c1.models.Collection.findOne({
            id: col.id
        });
        expect(collection).toBeUndefined();
    });
    test('Respond with NOT_FOUND if collection does not exist', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionDelete.call(c1, {
            uuid: `a${col.uuid}`
        }, endpoint, ack);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'NOT_FOUND'),
            payload: {},
            acknowledge: ack
        });
        const collection = await c1.models.Collection.findOne({
            id: col.id
        });
        expect(collection).toBeDefined();
    });
    test('Respond with FORBIDDEN if collection was not created by user', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[1]);
        const ack = 'abcd';
        await collectionDelete.call(c1, {
            uuid: col.uuid
        }, endpoint, ack);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'FORBIDDEN'),
            payload: {},
            acknowledge: ack
        });
        const collection = await c1.models.Collection.findOne({
            id: col.id
        });
        expect(collection).toBeDefined();
    });
});
