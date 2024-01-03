import { describe, test, expect, vi, beforeEach } from 'vitest';
import defineHTTPController, {
    HTTPUserControllerType
} from '../../../../controllers/http';
import { ReqError } from '../../../../controllers/http/utils/resHandler';
import JWT from '../../../../utils/jwt';
import { ZodError } from 'zod';
import SQLiteGateways from '../../../../app/gateways/sqlite';
import { IUser } from '../../../../app/models/interface/user';
import Models from '../../../../app/models';
import config from '../../../../config';
import { Writable } from 'stream';

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
        }) as any;
        const nextMock = vi.fn();
        class WriteTableResMock extends Writable implements NodeJS.WritableStream {
            json = jsonMock;
            status = statusMock;
            locals = {
                logger: {
                    log: loggerErrorMock
                }
            };
        }
        const res = new WriteTableResMock();
        let HTTPUserController!: HTTPUserControllerType;
        let user!: IUser;
        beforeEach(async () => {
            // Delete all users
            const gateways = await SQLiteGateways.create({
                log: loggerErrorMock
            });
            const models = new Models({
                gateways
            });
            user = await models.User.register(usrInfo.name, usrInfo.password);
            HTTPUserController = defineHTTPController({
                models,
                config: config
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
                query: {},
                session: {}
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
                query: {},
                session: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ReqError));
        });
        test('Successfully login with correct username and password', async () => {
            const req = {
                body: {
                    username: usrInfo.name,
                    password: usrInfo.password,
                    remember: true
                },
                params: {},
                query: {},
                session: {}
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
                query: {},
                session: {}
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
                query: {},
                session: {}
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
                query: {},
                session: {}
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
                query: {},
                session: {}
            };
            await HTTPUserController.login(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
    });
    describe('Session', () => {
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
        }) as any;
        const nextMock = vi.fn();
        class WriteTableResMock extends Writable implements NodeJS.WritableStream {
            json = jsonMock;
            status = statusMock;
            locals = {
                logger: {
                    log: loggerErrorMock
                }
            };
        }
        const res = new WriteTableResMock();
        let HTTPUserController!: HTTPUserControllerType;
        let user!: IUser;
        beforeEach(async () => {
            // Delete all users
            const gateways = await SQLiteGateways.create({
                log: loggerErrorMock
            });
            const models = new Models({
                gateways
            });
            user = await models.User.register(usrInfo.name, usrInfo.password);
            HTTPUserController = defineHTTPController({
                models,
                config: config
            });
            jsonMock.mockClear();
            statusMock.mockClear();
            loggerErrorMock.mockClear();
            nextMock.mockClear();
        });
        test('Throw an error when the user is not logged in', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {}
            };
            await HTTPUserController.session(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ReqError));
        });
        test('Successfully get the user session', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {
                    usrID: user.id
                }
            };
            await HTTPUserController.session(req, res, nextMock);
            expect(nextMock).not.toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledTimes(1);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'AUTH_SUCCESS',
                    data: {
                        name: usrInfo.name,
                        token: expect.any(String)
                    },
                    description: 'Authentication successful'
                })
            );
        });
        test('Throw an error if session usrID does not exist', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {
                    usrID: 'wrongUsrID'
                }
            };
            await HTTPUserController.session(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ReqError));
        }
        );
        test('Throw an error if can not destroy session', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {
                }
            };
            await HTTPUserController.session(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(Error));
        });
        test('Successfully logout', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {
                    usrID: user.id,
                    destroy: (cb: ()=>void)=>{
                        cb();
                    }
                }
            };
            await HTTPUserController.logout(req, res, nextMock);
            expect(nextMock).not.toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledTimes(1);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'OK',
                    description: 'Ok'
                })
            );
        });
        test('Session destroy error', async () => {
            const req = {
                body: {},
                params: {},
                query: {},
                session: {
                    usrID: user.id,
                    destroy: (cb: (err: unknown)=>void)=>{
                        cb(new Error('Session destroy error'));
                    }
                }
            };
            await HTTPUserController.logout(req, res, nextMock);
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(Error));
        }
        );


    });
});

