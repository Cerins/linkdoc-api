import { describe, test, expect, vi, beforeEach } from 'vitest';
import defineHTTPUserController from '../../../controllers/http/user';
import { ReqError } from '../../../controllers/http/utils/resHandler';
import JWT from '../../../utils/jwt';
import { ZodError } from 'zod';

describe('HTTP User controller test', () => {
    describe('Login', () => {
        const usrInfo = {
            name: 'usrName',
            password: 'usrPassword'
        };
        const wrongUsrInfo = {
            name: 'wrongUsrName',
            password: 'wrongUsrPassword'
        };
        const usrID = 'id';
        const findMock = vi.fn(({ id, name }: {
            id?: string,
            name?: string
        }) => {
            if (name === usrInfo.name) {
                return Promise.resolve({
                    id: usrID,
                    name: usrInfo.name,
                    validatePassword: vi.fn((password: string) => {
                        if (password === usrInfo.password) {
                            return Promise.resolve(true);
                        }
                        return Promise.resolve(false);
                    })
                });
            }
            return Promise.resolve(undefined);
        });
        const User = {
            find: findMock
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
        const HTTPUserController = defineHTTPUserController({
            models: {
                User
            }
        });
        beforeEach(() => {
            // Clears the information about calls to the mock's functions
            findMock.mockClear();
            jsonMock.mockClear();
            statusMock.mockClear();
            loggerErrorMock.mockClear();
            nextMock.mockClear();
        });
        test(
            'Throw an error when logging in with a correct username but incorrect password"',
            async () => {
                const req = {
                    body: {
                        username: usrInfo.name,
                        password: wrongUsrInfo.password
                    },
                    params: {},
                    query: {}
                };
                await HTTPUserController.login(req, res, nextMock);
                expect(findMock).toHaveBeenCalledTimes(1);
                expect(nextMock).toHaveBeenCalledTimes(1);
                expect(nextMock).toBeCalledWith(expect.any(ReqError));
            });
        test(
            'Throw an error when logging in with a non-existent username'
            , async () => {
                const req = {
                    body: {
                        username: wrongUsrInfo.name,
                        password: usrInfo.password
                    },
                    params: {},
                    query: {}
                };
                await HTTPUserController.login(req, res, nextMock);
                expect(findMock).toHaveBeenCalledTimes(1);
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
            expect(findMock).toHaveBeenCalledTimes(1);
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
            expect(jwt.get('usrID')).toBe(usrID);
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
            expect(findMock).not.toHaveBeenCalled();
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
            expect(findMock).not.toHaveBeenCalled();
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
            expect(findMock).not.toHaveBeenCalled();
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
            expect(findMock).not.toHaveBeenCalled();
            expect(nextMock).toHaveBeenCalledTimes(1);
            expect(nextMock).toBeCalledWith(expect.any(ZodError));
        });
    });
});
