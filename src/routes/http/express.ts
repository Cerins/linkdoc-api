import type IHTTPUserController from '../../controllers/http/user';
import express from 'express';
interface Dependencies {
    controllers: {
        HTTPUserController: IHTTPUserController
    }

}


class ExpressAPI {
    dependencies: Dependencies;
    app: express.Application;
    constructor(dependencies: Dependencies) {
        const { HTTPUserController } = dependencies.controllers;
        this.dependencies = dependencies;
        this.app = express();
        this.app.get('/', HTTPUserController.login.bind(HTTPUserController));
    }

    async start() {
        this.app.listen(3000, () => {
            console.log('Example app listening on port 3000!');
        });
    }
}

export default ExpressAPI;