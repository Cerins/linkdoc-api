import { describe, test, expect, vi, beforeEach } from 'vitest';
import defineHTTPUserController, {
    IHTTPUserController
} from '../../../../controllers/http/user';
import { ReqError } from '../../../../controllers/http/utils/resHandler';
import JWT from '../../../../utils/jwt';
import { ZodError } from 'zod';
import SQLiteGateways from '../../../../app/gateway/sqlite';
import { IUser } from '../../../../app/model/interface/user';
import Models from '../../../../app/model';

describe('HTTP User controller', () => {
    describe('Login', () => {
        const usrInfo = {
            name: 'usrName',
            password: 'usrPassword'
        };
        const wrongUsrInfo = {
            name: 'wrongUsrName',
            password: 'wrongUsrPassword'
        };
        const loggerErrorMock = vi.fn();
        const jsonMock = vi.fn();
        const statusMock = vi.fn(() => {
            return {
                json: jsonMock,
                locals: {
                    logger: {
                        log: loggerErrorMock
                    }
                },
                status: vi.fn()
            };
        });
        const nextMock = vi.fn();
        const res = {
            json: jsonMock,
            status: statusMock,
            locals: {
                logger: {
                    log: loggerErrorMock
                }
            }
        };
        let HTTPUserController!: IHTTPUserController;
        let user!: IUser;
        beforeEach(async () => {
            // Delete all users
            const gateway = await SQLiteGateways.create({
                log: loggerErrorMock
            });
            const models = new Models({
                gateway
            });
            user = await models.User.register(usrInfo.name, usrInfo.password);
            HTTPUserController = defineHTTPUserController({
                models
            });
            jsonMock.mockClear();
            statusMock.mockClear();
            loggerErrorMock.mockClear();
            nextMock.mockClear();
        });
        test(`Throw an error when logging in with a correct username
         but incorrect password`, async () => {
            const req = {
                body: {
                    username: usrInfo.name,
                    password: wrongUsrInfo.password
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ReqError));
        });
        test('Throw an error when logging in with a non-existent username', async () => {
            const req = {
                body: {
                    username: wrongUsrInfo.name,
                    password: usrInfo.password
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ReqError));
        });
        test('Successfully login with correct username and password', async () => {
            const req = {
                body: {
                    username: usrInfo.name,
                    password: usrInfo.password
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).not.toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledTimes(1);
            expect(jsonMock).toHaveBeenCalledWith({
                description: 'Authentication successful',
                message: 'AUTH_SUCCESS',
                data: {
                    token: expect.any(String)
                }
            });
            // Check if the token is valid
            const { token } = jsonMock.mock.calls[0][0].data;
            const jwt = JWT.validate(token);
            expect(jwt.get('usrID')).toBe(user.id);
            // Expect iat and exp to be a number
            expect(jwt.get('iat')).toEqual(expect.any(Number));
            expect(jwt.get('exp')).toEqual(expect.any(Number));
        });
        test('Throw an error when the username is not a string', async () => {
            const req = {
                body: {
                    username: 123,
                    password: usrInfo.password
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
        test('Throw an error when the password is not a string', async () => {
            const req = {
                body: {
                    username: usrInfo.name,
                    password: 123
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
        test('Throw an error when the username is not provided', async () => {
            const req = {
                body: {
                    password: usrInfo.password
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
        test('Throw an error when the password is not provided', async () => {
            const req = {
                body: {
                    username: usrInfo.name
                },
                params: {},
                query: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
    });
});
