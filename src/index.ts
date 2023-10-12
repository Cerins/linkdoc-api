import defineUser from './app/model/user';
import UserMemoryGateway from './app/gateway/memory/user';
import HTTPUserController from './controllers/http/user';
import ExpressAPI from './routes/http/express';

// TODO - Move to .env file
const UserConfig = {
    saltRounds: 10
};

const models = {
    User: defineUser({
        UserGateway: UserMemoryGateway
    }, UserConfig)
};

const controllers = {
    HTTPUserController: new HTTPUserController(
        {
            models
        }
    )
};


const httpUserRouter = new ExpressAPI(
    {
        controllers
    }
);

httpUserRouter.start().catch((err)=>{
    console.error(err);
});

