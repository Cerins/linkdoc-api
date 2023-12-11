import ILogger from './interface/logger';
import knex, { Knex } from 'knex';

interface Config {
  filename: string | ':memory:';
}

interface Dependencies {
  config: Config;
  logger: ILogger;
}

async function buildDB(dependencies: Dependencies, upScripts?: string[]) {
    const { filename } = dependencies.config;
    // Setup knex with sqlite3
    const db = knex({
        client: 'sqlite3',
        connection: {
            filename,
            timezone: ''
        },
        log: {
            warn(message) {
                dependencies.logger.log('info', 'SQLITE WARN', {
                    message
                });
            },
            error(message) {
                dependencies.logger.log('error', 'SQLITE ERROR', {
                    message
                });
            },
            deprecate(message) {
                dependencies.logger.log('warn', 'SQLITE DEPRECATE', {
                    message
                });
            },
            debug(message) {
                dependencies.logger.log('info', 'SQLITE DEBUG', {
                    message
                });
            }
        }

    });
    db.on('query', (query) => {
        dependencies.logger.log('info', 'SQLITE QUERY', {
            query: {
                method: query.method,
                sql: query.sql
                // Do not want to see this this is potentially sensitive
                // bindings: query.bindings
                // Or in other words: "speak no evil"
            }
        });
    });
    // Run setup scripts
    if (upScripts && upScripts.length > 0) {
        for (const script of upScripts) {
            await db.raw(script);
        }
    }
    return db;
}

async function closeDB(db: Knex) {
    await db.destroy();
}

export { buildDB, closeDB };
