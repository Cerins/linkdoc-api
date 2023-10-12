import type { IUser } from '../../app/model/interface/user';

interface Dependencies {
    models: {
        User: IUser
    }
}

interface Request {
    body: unknown
}

interface Response {
    json: (data: unknown)=>void
}

class HTTPUserController {

    private dependencies: Dependencies;

    constructor(
        dependencies: Dependencies
    ) {
        this.dependencies = dependencies;
    }

    async login(req: Request, res:Response) {
        res.json({
            'hello': 'world'
        });
    }
}

export default HTTPUserController;