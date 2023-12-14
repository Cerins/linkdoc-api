import { object, z } from 'zod';
import ResponseHelper, { IReq, IRes } from './utils/resHandler';
import async from './utils/handlePromise';
import JWT from '../../utils/jwt';
import { IUserType } from '../../app/models/interface/user';

interface Dependencies {
  models: {
    User: IUserType;
  };
}

const USRResponse = new ResponseHelper({
    OK: {
        code: 200,
        description: 'Ok'
    },
    SYS_ERROR: {
        code: 500,
        description: 'System error happened'
    },
    AUTH_SUCCESS: {
        code: 200,
        description: 'Authentication successful'
    },
    AUTH_FAILED: {
        code: 401,
        description: 'Authentication failed'
    }
});

const loginBodySchema = z.object({
    username: z.string(),
    password: z.string(),
    remember: z.boolean().optional()
});

function defineHTTPUserController(dependencies: Dependencies) {
    class HTTPUserController {
        private constructor() {}

        @async()
        static async login(req: IReq, res: IRes, next: unknown) {
            const { User } = dependencies.models;
            const { username, password, remember } = loginBodySchema.parse(req.body);
            const user = await User.findOne({
                name: username
            });
            if (!user) {
                throw USRResponse.error('AUTH_FAILED', undefined, {
                    username,
                    reason: 'User not found'
                });
            }
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                throw USRResponse.error('AUTH_FAILED', undefined, {
                    username,
                    reason: 'Invalid password'
                });
            }
            if(remember) {
                (req.session as {
                usrID: string
                }).usrID = user.id;
            }
            const jwt = new JWT({
                usrID: user.id
            });
            USRResponse.send(res, 'AUTH_SUCCESS', {
                token: jwt.sign()
            });
        }

        @async()
        static async session(req: IReq, res: IRes, next: unknown) {
            const { User } = dependencies.models;
            const usrID
            = typeof req.session === 'object'
            && req.session !== null
            && 'usrID' in req.session
            && typeof req.session.usrID === 'string'
                ? req.session.usrID : undefined;
            if(usrID === undefined) {
                throw USRResponse.error('AUTH_FAILED', undefined, {
                    reason: 'No session'
                });
            }
            const user = await User.findOne({
                id: usrID
            });
            if (!user) {
                throw USRResponse.error('AUTH_FAILED', undefined, {
                    usrID,
                    reason: 'User not found'
                });
            }
            const jwt = new JWT({
                usrID: user.id
            });
            USRResponse.send(res, 'AUTH_SUCCESS', {
                token: jwt.sign(),
                name: user.name
            });
        }

        @async()
        static async logout(req: IReq, res: IRes, next: unknown) {
            if(
                typeof req.session === 'object'
                    && req.session !== null
                    && 'destroy' in req.session
                    && typeof req.session.destroy === 'function'
            ) {
                req.session.destroy((err: unknown)=>{
                    if(err) {
                        throw USRResponse.error('SYS_ERROR', undefined, {
                            reason: 'Could not destroy session',
                            error: err
                        });
                    }
                    USRResponse.send(res, 'OK');
                });
            } else {
                throw new Error('No session destroy');
            }
        }


    }
    return HTTPUserController;
}

type HTTPUserControllerType = ReturnType<typeof defineHTTPUserController>;

export default defineHTTPUserController;
export type { HTTPUserControllerType };
