import { describe, test, beforeEach, expect, vi } from 'vitest';
import outputType from '../../../../../../controllers/websocket/utils/outputType';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../../utils/environment/controller';
import collectionRead from '../../../../../../controllers/websocket/handlers/collections/read';

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

describe('collection read', () => {
    let env: ControllerEnvironment;
    beforeEach(async () => {
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: usrInfo
        });
    });

    test('Retrieve collections in descending order by date', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);

        const mockCollections = [
            { uuid: 'uuid1', time: new Date('2023-01-02'), user: '1', name: 'name1' },
            { uuid: 'uuid2', time: new Date('2023-01-01'), user: '2', name: 'name2' }
        ];
        vi.spyOn(c1.user, 'getCollectionList').mockResolvedValue(mockCollections);

        await collectionRead.call(c1, {}, 'COL.READ');
        expect(ws1.send).toHaveBeenCalledTimes(1);
        const content = JSON.parse(ws1.send.mock.calls[0][0]);
        expect(content).toMatchObject({
            type: outputType('COL.READ', 'OK'),
            payload: {
                collections: mockCollections.map((collection) => ({
                    uuid: collection.uuid,
                    time: collection.time.toISOString()
                }))
            }
        });

        expect(
            new Date(content.payload.collections[0].time)
        > new Date(content.payload.collections[1].time)
        ).toBe(true);
    });

    test('Handle empty collection list', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);

        vi.spyOn(c1.user, 'getCollectionList').mockResolvedValue([]);

        await collectionRead.call(c1, {}, 'COL.READ');
        expect(ws1.send).toHaveBeenCalledTimes(1);
        const content = JSON.parse(ws1.send.mock.calls[0][0]);
        expect(content).toMatchObject({
            type: outputType('COL.READ', 'OK'),
            payload: {
                collections: []
            }
        });
    });

    test('Have the proper collection list structure', async () => {
        const ws1 = createWebSocketMock();
        const c1 = new env.WSWebsocketController(ws1, env.users[0]);

        const mockCollection = [{ uuid: 'uuid1',
            time: new Date('2023-01-02'),
            user: 'user 1',
            name: 'name 1'
        }];
        vi.spyOn(c1.user, 'getCollectionList').mockResolvedValue(mockCollection);

        await collectionRead.call(c1, {}, 'COL.READ');
        expect(ws1.send).toHaveBeenCalledTimes(1);
        const content = JSON.parse(ws1.send.mock.calls[0][0]);

        expect(content.payload.collections[0]).toHaveProperty('uuid');
        expect(content.payload.collections[0]).toHaveProperty('time');
        expect(typeof content.payload.collections[0].uuid).toBe('string');
        expect(new Date(content.payload.collections[0].time)).toBeInstanceOf(Date);
    });
});
