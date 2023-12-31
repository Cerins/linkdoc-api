import defineHTTPController from './controllers/http';
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
import documentRead from './controllers/websocket/handlers/documents/read';
import collectionRead from './controllers/websocket/handlers/collections/read';
import collectionShareInfo from './controllers/websocket/handlers/collections/shareStatus';
import documentSelection from './controllers/websocket/handlers/documents/selection';
import documentOperation from './controllers/websocket/handlers/documents/operation';


async function main() {
    const logger = createLogger();
    process.on('uncaughtException', (e)=>{
        logger.log('error',
            'Unhandled exception',
            {
                error: {
                    message: e.message,
                    stack: e.stack,
                    name: e.name
                }
            }
        );
    });
    const gateways = await SQLiteGateways.create(logger);
    const models = new Models({
        gateways
    });
    const controllers = {
        HTTPController: defineHTTPController({
            models,
            config
        }),
        SocketController: defineSocketController({
            config: {
                ...config.controllers.websocket
            },
            logger,
            models,
            gateways
        })
            .registerHandler('COL.READ', collectionRead)
            .registerHandler('COL.CREATE', collectionsCreate)
            .registerHandler('COL.DELETE', collectionDelete)
            .registerHandler('COL.SHARE', collectionShare)
            .registerHandler('COL.SHARE.INFO', collectionShareInfo)
            .registerHandler('DOC.READ', documentRead)
            .registerHandler('DOC.SELECTION', documentSelection)
            .registerHandler('DOC.OPERATION', documentOperation)

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

main();