import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import collectionCreate from '../../../../../../controllers/websocket/handlers/collections/create';
import outputType from '../../../../../../controllers/websocket/utils/outputType';

const usrInfo = [
    {
        name: 'usrName1',
        password: 'usrPassword1'
    }
];

const endpoint = 'COL.CREATE';

const colInfo = [
    {
        name: 'colName1'
    }
];

describe('collection create', () => {
    let env: ControllerEnvironment;
    beforeEach(async () => {
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: usrInfo
        });
    });
    test('Create collection', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionCreate.call(c1, colInfo[0], endpoint, ack);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                ...colInfo[0]
            },
            acknowledge: ack
        });
        expect(content.payload.uuid).toBeDefined();
        // expect(content.payload.id).toBeDefined();
        const collection = await c1.models.Collection.findOne({
            id: content.id
        });
        expect(collection).toBeDefined();
    });
    test('Create collection but not acknowledge', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        await collectionCreate.call(c1, colInfo[0], endpoint);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {
                ...colInfo[0]
            }
        });
    });
    test('Respond with BAD_REQUEST if name is too short', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        await collectionCreate.call(c1, {
            name: ''
        }, endpoint);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'BAD_REQUEST'),
            payload: {
                code: 'NAME_MIN',
                message: 'name too short'
            }
        });
    });
    test('Respond with BAD_REQUEST if name is too long', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        await collectionCreate.call(c1, {
            // TODO automatically set the upper limit
            name: (()=>{
                let name = '';
                for(let i=0;i<32;i++){
                    name += 'a';
                }
                return name;
            })()
        }, endpoint);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'BAD_REQUEST'),
            payload: {
                code: 'NAME_MAX',
                message: 'name too long'
            }
        });
    });
    test('Respond with BAD_REQUEST if payload schema mismatch', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        await collectionCreate.call(c1, 5, endpoint);
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'BAD_REQUEST'),
            payload: {
                code: 'SCHEMA_MISMATCH',
                message: 'schema mismatch'
            }
        });
    });
    test('Respond with BAD_REQUEST if duplicate', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        await collectionCreate.call(c1, usrInfo[0], endpoint);
        await collectionCreate.call(c1, usrInfo[0], endpoint);
        expect(ws1.send).toHaveBeenCalledTimes(2);
        const content = JSON.parse(ws1.send.mock.calls[1]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'BAD_REQUEST'),
            payload: {
                code: 'DUPLICATE',
                message: 'item already exists'
            }
        });
    });
});
