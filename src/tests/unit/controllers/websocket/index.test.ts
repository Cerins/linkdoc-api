import { beforeEach, describe, expect, test, vi } from 'vitest';
import defineSocketController, {
    SocketControllerType
} from '../../../../controllers/websocket';
import JWT from '../../../../utils/jwt';
import { IUser } from '../../../../app/model/interface/user';
import Models from '../../../../app/model';
import SQLiteGateways from '../../../../app/gateway/sqlite';

describe('Websocket ws controller', () => {
    const usrInfo = {
        name: 'usrName',
        password: 'usrPassword'
    };
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
        removeListener: vi.fn()
    };
    const webSocketMock = {
        on: vi.fn(),
        send: vi.fn()
    };
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
        const gateway = await SQLiteGateways.create(loggerMock);
        const models = new Models({
            gateway
        });
        user = await models.User.register(usrInfo.name, usrInfo.password);
        WSWebsocketController = defineSocketController({
            config: {
                baseUrl
            },
            models,
            logger: loggerMock
        });
    });
    describe('onUpgrade', () => {
        test('Socket responds 401 if no token given', async () => {
            await new Promise((res) => {
                WSWebsocketController.onUpgrade.call(
                    wssMock,
                    {},
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
                        url: `${baseUrl}?token=5`
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
                        url: `${baseUrl}?token=${token}`
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
                        url: `${baseUrl}?token=${token}`
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
                        url: url.toString()
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

            WSWebsocketController.registerHandler(channel, (payload: unknown) => {
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
            WSWebsocketController.registerHandler(channel, (payload: unknown) => {});
            expect.assertions(1);
            try {
                WSWebsocketController.registerHandler(
                    channel,
                    (payload: unknown) => {}
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
});
