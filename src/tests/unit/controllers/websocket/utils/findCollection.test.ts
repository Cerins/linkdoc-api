import { beforeEach, describe, expect, test } from 'vitest';
import createControllerEnvironment, {
    ControllerEnvironment,
    createWebSocketMock
} from '../../../../utils/environment/controller';
import outputType from '../../../../../controllers/websocket/utils/outputType';
import { ICollection } from '../../../../../app/models/interface/collection';
import collectionShare from '../../../../../controllers/websocket/handlers/collections/share';
import { ColVisibility } from '../../../../../app/gateways/interface/collection';
import collectionChecked from '../../../../../controllers/websocket/utils/findCollection';
import RequestError from '../../../../../controllers/websocket/utils/error/request';

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
    test('Throw request error when collection needs to be specific users', async () => {
        expect.assertions(1);
        try{
            const ws1 = createWebSocketMock();
            const c1 = new env.WSWebsocketController(ws1, env.users[1]);
            const col = await collectionChecked(c1, collection.uuid, null, true);
        }catch(err) {
            expect(err).toBeInstanceOf(RequestError);
        }
    });
});
