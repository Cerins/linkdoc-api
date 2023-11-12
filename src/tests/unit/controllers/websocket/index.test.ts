import { beforeEach, describe, expect, test, vi } from 'vitest';
import JWT from '../../../../utils/jwt';
import createControllerEnvironment, {
    ControllerEnvironment,
    createHeadMock,
    createSocketMock,
    createWebSocketMock,
    createWebSocketServerMock
} from '../../../utils/environment/controller';

const usrInfo = {
    name: 'usrName',
    password: 'usrPassword'
};

describe('Websocket ws controller', () => {
    let env: ControllerEnvironment;
    let wssMock = createWebSocketServerMock();
    let socketMock = createSocketMock();
    let webSocketMock = createWebSocketMock();
    let head = createHeadMock();
    beforeEach(async () => {
        wssMock = createWebSocketServerMock();
        socketMock = createSocketMock();
        head = createHeadMock();
        webSocketMock = createWebSocketMock();
        env = await createControllerEnvironment({
            baseUrl: 'http://www.test.com',
            users: [usrInfo]
        });
    });
    describe('onUpgrade', () => {
        test('Socket responds 401 if no token given', async () => {
            await new Promise((res) => {
                env.WSWebsocketController.onUpgrade.call(
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
                env.WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${env.baseUrl}?token=5`,
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
                env.WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${env.baseUrl}?token=${token}`,
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
                usrID: env.users[0].id
            });
            const token = jwt.sign();
            await new Promise((res) => {
                env.WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {
                        url: `${env.baseUrl}?token=${token}`,
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
                usrID: env.users[0].id
            });
            const url = new URL(env.baseUrl);

            await new Promise((res) => {
                env.WSWebsocketController.onUpgrade.call(
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

            env.WSWebsocketController.registerHandler(
                channel,
                async (payload: unknown) => {
                    listenerFn(payload);
                }
            );
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
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
            env.WSWebsocketController.registerHandler(
                channel,
                async (payload: unknown) => {}
            );
            expect.assertions(1);
            try {
                env.WSWebsocketController.registerHandler(
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
            env.loggerMock.log.mockClear();
            const userPayload = 'hello world!';
            const channel = 'TEST';
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
            const msg = Buffer.from(
                JSON.stringify({
                    type: channel,
                    payload: userPayload
                })
            );
            controller.onMessage(msg);
            expect(env.loggerMock.log).toHaveBeenCalledOnce();
            expect(env.loggerMock.log.mock.calls[0][0]).toBe('error');
        });
    });
    describe('emit', () => {
        test('Call ws when emit', () => {
            const type = 'type';
            const payload = 10;
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
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
    describe('connect', () => {
        test('Register listeners on connect', () => {
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
            controller.connect();
            expect(webSocketMock.on).toHaveBeenCalledTimes(3);
            const listeners = webSocketMock.on.mock.calls.map((c) => c[0]).sort();
            const expectedListeners = ['error', 'message', 'close'].sort();
            expect(listeners).toEqual(expectedListeners);
        });
    });
    describe('onError', () => {
        test('Log on onError', () => {
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
            env.loggerMock.log.mockClear();
            controller.onError();
            expect(env.loggerMock.log).toHaveBeenCalledOnce();
        });
    });
    describe('onClose', () => {
        test('Log on onClose', () => {
            const controller = new env.WSWebsocketController(
                webSocketMock,
                env.users[0]
            );
            env.loggerMock.log.mockClear();
            controller.onClose();
            expect(env.loggerMock.log).toHaveBeenCalledOnce();
        });
    });
    describe('emitRoom', () => {
        test('emitRoom emits to all in the room', async () => {
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new env.WSWebsocketController(ws1, env.users[0]);
            const c2 = new env.WSWebsocketController(ws2, env.users[0]);
            c1.join(room);
            c2.join(room);
            c1.emitRoom(room, type, payload);
            expect(ws1.send).toHaveBeenCalledTimes(1);
            expect(ws2.send).toHaveBeenCalledTimes(1);
            const content = JSON.stringify({
                type,
                payload
            });
            expect(ws1.send).toBeCalledWith(content);
            expect(ws2.send).toBeCalledWith(content);
        });
    });
    describe('broadcastRoom', () => {
        test('broadCatRoom emits to all except the sender in the room', async () => {
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new env.WSWebsocketController(ws1, env.users[0]);
            const c2 = new env.WSWebsocketController(ws2, env.users[0]);
            c1.join(room);
            c2.join(room);
            c1.broadcastRoom(room, type, payload);
            expect(ws1.send).toHaveBeenCalledTimes(0);
            expect(ws2.send).toHaveBeenCalledTimes(1);
            const content = JSON.stringify({
                type,
                payload
            });
            expect(ws2.send).toBeCalledWith(content);
        });
    });
    describe('leave', () => {
        test('not receive room emits after leaving', async () => {
            const room = 'room';
            const type = 'type';
            const payload = 5;
            const ws1 = createWebSocketMock();
            const ws2 = createWebSocketMock();
            const c1 = new env.WSWebsocketController(ws1, env.users[0]);
            const c2 = new env.WSWebsocketController(ws2, env.users[0]);
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
            expect(ws1.send).toBeCalledWith(content);
        });
    });
});
