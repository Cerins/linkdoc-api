import { z } from 'zod';
import type { IUser } from '../../app/model/interface/user';
import ResponseHelper, { IReq, IRes } from './utils/resHandler';
import async from './utils/handlePromise';
import JWT from '../../utils/jwt';

interface Dependencies {
  models: {
    User: IUser;
  };
}

const USRResponse = new ResponseHelper({
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
    password: z.string()
});

function defineHTTPUserController(dependencies: Dependencies) {
    class HTTPUserController {
        private constructor() {}

        @async()
        static async login(req: IReq, res: IRes) {
            const { User } = dependencies.models;
            const { username, password } = loginBodySchema.parse(req.body);
            const user = await User.findByUsername(username);
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
            const jwt = new JWT({
                usrID: user.id
            });
            USRResponse.send(res, 'AUTH_SUCCESS', {
                token: jwt.sign()
            });
        }
    }
    return HTTPUserController;
}

type IHTTPUserController = ReturnType<typeof defineHTTPUserController>;

export default defineHTTPUserController;
export type { IHTTPUserController };
