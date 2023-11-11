import { beforeEach, describe, expect, test, vi } from 'vitest';
import defineSocketController, {
    SocketControllerType
} from '../../../../controllers/websocket';
import JWT from '../../../../utils/jwt';
import { IUser } from '../../../../app/model/interface/user';
import Models from '../../../../app/model';
import SQLiteGateways from '../../../../app/gateway/sqlite';
import async from '../../../../controllers/http/utils/handlePromise';

function createWebSocketMock() {
    return {
        on: vi.fn(),
        send: vi.fn()
    };
}
const usrInfo = {
    name: 'usrName',
    password: 'usrPassword'
};

describe('Websocket ws controller', () => {
    const baseUrl = 'http://test.com';
    const loggerMock = {
        log: vi.fn()
    };
    const wssMock = {
        emit: vi.fn(),
        handleUpgrade: vi.fn()
    };
    const head = null;
    const socketMock = {
        on: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        removeListener: vi.fn(),
        headers: [],
        remoteAddress: ''
    };
    const webSocketMock = createWebSocketMock();
    let WSWebsocketController!: SocketControllerType;
    let user!: IUser;
    beforeEach(async () => {
        loggerMock.log.mockClear();
        wssMock.emit.mockClear();
        wssMock.handleUpgrade.mockClear();
        socketMock.on.mockClear();
        socketMock.write.mockClear();
        socketMock.destroy.mockClear();
        socketMock.removeListener.mockClear();
        webSocketMock.on.mockClear();
        webSocketMock.send.mockClear();
        const gateways = await SQLiteGateways.create(loggerMock);
        const models = new Models({
            gateways
        });
        user = await models.User.register(usrInfo.name, usrInfo.password);
        WSWebsocketController = defineSocketController({
            config: {
                baseUrl
            },
            models,
            logger: loggerMock,
            gateways
        });
    });
    describe('onUpgrade', () => {
        test('Socket responds 401 if no token given', async () => {
            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        headers: {},
                        socket: {}
                    },
                    socketMock,
                    head,
                    (err, usr) => {
                        res(usr);
                    }
                );
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Socket responds 401 if token is invalid', async () => {
            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${baseUrl}?token=5`,
                        headers: {},
                        socket: {}
                    },
                    socketMock,
                    head,
                    (err, usr) => {
                        res(usr);
                    }
                );
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Socket responds 401 token is valid, but no user', async () => {
            const jwt = new JWT({
                usrID: '-1'
            });
            const token = jwt.sign();
            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${baseUrl}?token=${token}`,
                        headers: {},
                        socket: {}
                    },
                    socketMock,
                    head,
                    (err, usr) => {
                        res(usr);
                    }
                );
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Establish connection on correct token', async () => {
            const jwt = new JWT({
                usrID: user.id
            });
            const token = jwt.sign();
            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${baseUrl}?token=${token}`,
                        headers: {},
                        socket: {}
                    },
                    socketMock,
                    head,
                    (err, usr) => {
                        res(usr);
                    }
                );
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(0);
            expect(socketMock.write).toHaveBeenCalledTimes(0);
            expect(wssMock.handleUpgrade).toHaveBeenCalledTimes(1);
        });
        test('Socket responds 401 if token is not string', async () => {
            const jwt = new JWT({
                usrID: user.id
            });
            const url = new URL(baseUrl);

            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: url.toString(),
                        headers: {},
                        socket: {}
                    },
                    socketMock,
                    head,
                    (err, usr) => {
                        res(usr);
                    }
                );
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
    });
    describe('registerHandler', () => {
        test('Register a handler', () => {
            const listenerFn = vi.fn();
            const userPayload = 'hello world!';
            const channel = 'TEST';

            WSWebsocketController.registerHandler(channel, async (payload: unknown) => {
                listenerFn(payload);
            });
            const controller = new WSWebsocketController(webSocketMock, user);
            const msg = Buffer.from(
                JSON.stringify({
                    type: channel,
                    payload: userPayload
                })
            );
            controller.onMessage(msg);
            expect(listenerFn).toHaveBeenCalledOnce();
            expect(listenerFn).toHaveBeenCalledWith(userPayload);
        });
        test('Throw an error when registering duplicate handler', () => {
            const channel = 'TEST';
            WSWebsocketController.registerHandler(channel, async (payload: unknown) => {});
            expect.assertions(1);
            try {
                WSWebsocketController.registerHandler(
                    channel,
                    async (payload: unknown) => {}
                );
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
            }
        });
    });
    describe('onMessage', () => {
        test('Throw an error when to handler exists', () => {
            // This is needed to be since every SQLITE QUERY IS LOGGED
            loggerMock.log.mockClear();
            const userPayload = 'hello world!';
            const channel = 'TEST';
            const controller = new WSWebsocketController(webSocketMock, user);
            const msg = Buffer.from(
                JSON.stringify({
                    type: channel,
                    payload: userPayload
                })
            );
            controller.onMessage(msg);
            expect(loggerMock.log).toHaveBeenCalledOnce();
            expect(loggerMock.log.mock.calls[0][0]).toBe('error');
        });
    });
    describe('emit', ()=>{
        test('Call ws when emit', ()=>{
            const type = 'type';
            const payload = 10;
            const controller = new WSWebsocketController(webSocketMock, user);
            controller.emit(type, payload);
            expect(webSocketMock.send).toHaveBeenCalledOnce();
            expect(webSocketMock.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type,
                    payload
                })
            );
        });
    });
    describe('connect', ()=>{
        test('Register listeners on connect', ()=>{
            const controller = new WSWebsocketController(webSocketMock, user);
            controller.connect();
            expect(webSocketMock.on).toHaveBeenCalledTimes(3);
            const listeners = webSocketMock.on.mock.calls.map((c)=>c[0]).sort();
            const expectedListeners = ['error', 'message', 'close'].sort();
            expect(listeners).toEqual(expectedListeners);
        });
    });
    describe('onError', ()=>{
        test('Log on onError', ()=>{
            const controller = new WSWebsocketController(webSocketMock, user);
            loggerMock.log.mockClear();
            controller.onError();
            expect(loggerMock.log).toHaveBeenCalledOnce();
        });
    });
    describe('onClose', ()=>{
        test('Log on onClose', ()=>{
            const controller = new WSWebsocketController(webSocketMock, user);
            loggerMock.log.mockClear();
            controller.onClose();
            expect(loggerMock.log).toHaveBeenCalledOnce();
        });
    });
    describe('emitRoom', ()=>{
        test('emitRoom emits to all in the room', async ()=>{
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new WSWebsocketController(ws1, user);
            const c2 = new WSWebsocketController(ws2, user);
            c1.join(room);
            c2.join(room);
            c1.emitRoom(room, type, payload);
            expect(ws1.send).toHaveBeenCalledTimes(1);
            expect(ws2.send).toHaveBeenCalledTimes(1);
            const content = JSON.stringify({
                type,
                payload
            });
            expect(ws1.send).toBeCalledWith(
                content
            );
            expect(ws2.send).toBeCalledWith(
                content
            );
        });
    });
    describe('broadcastRoom', ()=>{
        test('broadCatRoom emits to all except the sender in the room', async ()=>{
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new WSWebsocketController(ws1, user);
            const c2 = new WSWebsocketController(ws2, user);
            c1.join(room);
            c2.join(room);
            c1.broadcastRoom(room, type, payload);
            expect(ws1.send).toHaveBeenCalledTimes(0);
            expect(ws2.send).toHaveBeenCalledTimes(1);
            const content = JSON.stringify({
                type,
                payload
            });
            expect(ws2.send).toBeCalledWith(
                content
            );
        });
    });
    describe('leave', ()=>{
        test('not receive room emits after leaving', async ()=>{
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new WSWebsocketController(ws1, user);
            const c2 = new WSWebsocketController(ws2, user);
            c1.join(room);
            c2.join(room);
            c2.leave(room);
            c1.emitRoom(room, type, payload);
            expect(ws1.send).toHaveBeenCalledTimes(1);
            expect(ws2.send).toHaveBeenCalledTimes(0);
            const content = JSON.stringify({
                type,
                payload
            });
            expect(ws1.send).toBeCalledWith(
                content
            );
        });
    });
});
