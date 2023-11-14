import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import outputType from '../../../../../../controllers/websocket/utils/outputType';
import { ICollection } from '../../../../../../app/model/interface/collection';
import collectionShare from '../../../../../../controllers/websocket/handlers/collections/share';
import { ColVisibility } from '../../../../../../app/gateway/interface/collection';

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

const endpoint = 'COL.SHARE';

const colInfo = [
    {
        name: 'colName1'
    }
];

describe('collection create', () => {
    let env: ControllerEnvironment;
    let collection: ICollection;
    beforeEach(async () => {
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: usrInfo
        });
        collection = await env.users[0].createCollection(colInfo[0].name);
    });
    test('Share collection to user as read', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                users: [
                    {
                        name: env.users[1].name,
                        role: ColVisibility.READ
                    }
                ]
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(true);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(false);
    });
    test('Share collection to user as write', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                users: [
                    {
                        name: env.users[1].name,
                        role: ColVisibility.WRITE
                    }
                ]
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(true);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(true);
    });
    test('Unshare collection to user', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                users: [
                    {
                        name: env.users[1].name,
                        role: ColVisibility.WRITE
                    }
                ]
            },
            endpoint,
            ack
        );
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                users: [
                    {
                        name: env.users[1].name,
                        role: ColVisibility.PRIVATE
                    }
                ]
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledTimes(2);
        const content = JSON.parse(ws1.send.mock.calls[1]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(false);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(false);
    });
    test('Share collection as read', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                visibility: ColVisibility.READ
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(true);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(false);
    });
    test('Share collection as write', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                visibility: ColVisibility.WRITE
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(true);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(true);
    });
    test('Unshare collection', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                visibility: ColVisibility.WRITE
            },
            endpoint,
            ack
        );
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id,
                visibility: ColVisibility.PRIVATE
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledTimes(2);
        const content = JSON.parse(ws1.send.mock.calls[1]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'OK'),
            payload: {},
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(false);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(false);
    });
    test('Respond with BAD_REQUEST if user does not exist', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);
        const ack = 'abcd';
        await collectionShare.call(
            c1,
            {
                colUUID: collection.id
            },
            endpoint,
            ack
        );
        expect(ws1.send).toHaveBeenCalledOnce();
        const content = JSON.parse(ws1.send.mock.calls[0]);
        expect(content).toMatchObject({
            type: outputType(endpoint, 'BAD_REQUEST'),
            payload: {
                errors: [
                    {
                        code: 'USER_NOT_FOUND',
                        message: 'user not found'
                    }
                ]
            },
            acknowledge: ack
        });
        expect(
            await collection.hasAccessLevel(ColVisibility.READ, env.users[1].id)
        ).toBe(false);
        expect(
            await collection.hasAccessLevel(ColVisibility.WRITE, env.users[1].id)
        ).toBe(false);
    });
});
