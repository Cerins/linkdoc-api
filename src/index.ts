import defineHTTPUserController from './controllers/http/user';
import createLogger from './utils/logger';
import defineSocketController from './controllers/websocket';
import SQLiteGateways from './app/gateways/sqlite';
import Models from './app/models';
import collectionsCreate from './controllers/websocket/handlers/collections/create';
import { program } from 'commander';
import ConsoleController from './controllers/console';
import STDWriter from './utils/writer/std';
import config from './config';
import collectionDelete from './controllers/websocket/handlers/collections/delete';
import collectionShare from './controllers/websocket/handlers/collections/share';
import documentErase from './controllers/websocket/handlers/documents/erase';
import documentWrite from './controllers/websocket/handlers/documents/write';
import documentRead from './controllers/websocket/handlers/documents/read';
import collectionRead from './controllers/websocket/handlers/collections/read';


async function main() {
    const logger = createLogger();
    const gateways = await SQLiteGateways.create(logger);
    const models = new Models({
        gateways
    });
    const controllers = {
        HTTPUserController: defineHTTPUserController({
            models
        }),
        SocketController: defineSocketController({
            config: {
                // TODO - Setup config
                baseUrl: 'http://localhost:3000'
            },
            logger,
            models,
            gateways
        })
            .registerHandler('COL.READ', collectionRead)
            .registerHandler('COL.CREATE', collectionsCreate)
            .registerHandler('COL.DELETE', collectionDelete)
            .registerHandler('COL.SHARE', collectionShare)
            .registerHandler('DOC.READ', documentRead)
            .registerHandler('DOC.WRITE', documentWrite)
            .registerHandler('DOC.ERASE', documentErase)
    };
    const consoleController = new ConsoleController({
        logger,
        controllers,
        models,
        config
    }, new STDWriter());
    program.name('linkdoc-manger')
        .description('LinkDoc Management CLI')
        .version('0.0.1');

    program
        .command('user-register')
        .description('Register a new user')
        .option('-u, --username <username>', 'Username')
        .option('-p, --password <password>', 'Password')
        .action(async(options)=>{
            await consoleController.userRegister(options.username, options.password);
            // TODO This is done because of knex running in the background
            process.exit(0);
        });
    program
        .command('user-delete')
        .description('Remove a user')
        .option('-u, --username <username>', 'Username')
        .action(async (options) => {
            await consoleController.userDelete(options.username);
            // TODO This is done because of knex running in the background
            process.exit(0);
        });
    program
        .command('websocket-start')
        .description('Start the WebSocket server')
        .action(async () => {
            await consoleController.wsStart();
        });

    program
        .command('http-start')
        .description('Start the HTTP server')
        .action(async () => {
            await consoleController.httpStart();
        });
    await program.parseAsync(process.argv);
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(0);
});
