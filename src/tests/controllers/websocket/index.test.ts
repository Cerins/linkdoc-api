import { beforeEach, describe, expect, test, vi } from 'vitest';
import SQLiteGateways from '../../../app/gateway/sqlite';
import defineSocketController, { ISocket, SocketControllerType } from '../../../controllers/websocket';
import Models from '../../../app/model';
import JWT from '../../../utils/jwt';
import { IUser } from '../../../app/model/interface/user';


describe('Websocket ws controller', () => {
    describe('onUpgprade', () => {
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
        let WSWebsocketController!: SocketControllerType;
        let user!: IUser;
        beforeEach(async () => {
            loggerMock.log.mockReset();
            wssMock.emit.mockReset();
            wssMock.handleUpgrade.mockReset();
            socketMock.on.mockReset();
            socketMock.write.mockReset();
            socketMock.destroy.mockReset();
            socketMock.removeListener.mockReset();
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
        test('Socket responds 401 if no token given', async() => {
            await new Promise((res)=>{
                WSWebsocketController.onUpgrade.call(wssMock, {}, socketMock, head, (err, usr)=>{
                    res(usr);
                });
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Socket responds 401 if token is invalid', async() => {
            await new Promise((res)=>{
                WSWebsocketController.onUpgrade.call(wssMock, {
                    url: `${baseUrl}?token=5`
                }, socketMock, head, (err, usr)=>{
                    res(usr);
                });
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Socket responds 401 token is valid, but no user', async() => {
            const jwt = new JWT({
                usrID: '-1'
            });
            const token = jwt.sign();
            await new Promise((res)=>{
                WSWebsocketController.onUpgrade.call(wssMock, {
                    url: `${baseUrl}?token=${token}`
                }, socketMock, head, (err, usr)=>{
                    res(usr);
                });
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(1);
            expect(socketMock.write).toHaveBeenCalledTimes(1);
        });
        test('Establish connection on correct token', async() => {
            const jwt = new JWT({
                usrID: user.id
            });
            const token = jwt.sign();
            await new Promise((res)=>{
                WSWebsocketController.onUpgrade.call(wssMock, {
                    url: `${baseUrl}?token=${token}`
                }, socketMock, head, (err, usr)=>{
                    res(usr);
                });
            });
            expect(socketMock.destroy).toHaveBeenCalledTimes(0);
            expect(socketMock.write).toHaveBeenCalledTimes(0);
            expect(wssMock.handleUpgrade).toHaveBeenCalledTimes(1);
        });

    });
});
