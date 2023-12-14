import { IUserGateway } from '../../app/gateways/interface/user';
import { IUserCollectionGateway } from '../../app/gateways/interface/userCollection';
import PubSub from '../../app/gateways/memory/pubsub';
import { ICollectionType } from '../../app/models/interface/collection';
import { IDocumentType } from '../../app/models/interface/document';
import { IUserType } from '../../app/models/interface/user';
import { Config } from '../../config';
import ExpressAPI from '../../routers/http/express';
import WSWebsocket from '../../routers/websocket/ws';
import ILogger from '../../utils/interface/logger';
import Writer from '../../utils/writer';
import { HTTPUserControllerType } from '../http/user';
import { SocketControllerType } from '../websocket';

interface Dependencies {
    models: {
        User: IUserType,
        Collection: ICollectionType,
        Document: IDocumentType,
    },
    controllers: {
        HTTPUserController: HTTPUserControllerType
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