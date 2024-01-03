import { ICollectionType } from '../../app/models/interface/collection';
import { IDocumentType } from '../../app/models/interface/document';
import { IUserType } from '../../app/models/interface/user';
import { Config } from '../../config';
import ExpressAPI from '../../routers/http/express';
import WSWebsocket from '../../routers/websocket/ws';
import ILogger from '../../utils/interface/logger';
import Writer from '../../utils/writer';
import { HTTPUserControllerType as HTTPControllerType } from '../http';
import { SocketControllerType } from '../websocket';

interface Dependencies {
    models: {
        User: IUserType,
        Collection: ICollectionType,
        Document: IDocumentType,
    },
    controllers: {
        HTTPController: HTTPControllerType
        SocketController: SocketControllerType
    },
    logger: ILogger,
    config: Config
}

class ConsoleError extends Error {

}

class ConsoleController {
    private dependencies: Dependencies;

    private output: Writer;

    public constructor(dependencies: Dependencies, writer: Writer) {
        this.dependencies = dependencies;
        this.output = writer;
    }

    public async userDelete(name: string) {
        const user = await this.dependencies.models.User.findOne({
            name
        });
        if(user === undefined) {
            throw new Error('user not found');
        }
        await user.delete();
    }

    public async userRegister(name: string, password: string) {
        if(password.length < 8) {
            throw new Error('password too short');
        }
        if(name.length >= 32) {
            throw new Error('name too long');
        }
        if(name.length <= 0) {
            throw new Error('name too short');
        }
        await this.dependencies.models.User.register(name, password);
    }

    public async httpStart() {
        const httpRouter = new ExpressAPI({
            ...this.dependencies,
            config: {
                ...this.dependencies.config.routers.http
            }
        });
        await httpRouter.start();
    }

    public async wsStart() {
        const wsRouter = new WSWebsocket({
            ...this.dependencies,
            config: {
                port: this.dependencies.config.routers.websocket.port
            }
        });
        await wsRouter.start();
    }


}

export default ConsoleController;