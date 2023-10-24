import { Database } from 'sqlite3';
import ILogger from './interface/logger';

interface Config {
    filename: string | ':memory:';
}

interface Dependencies {
    config: Config;
    logger: ILogger;
}

async function buildDB(dependencies: Dependencies, upScripts?: string[]) {
    const { filename } = dependencies.config;
    const db = await new Promise<Database>((resolve, reject) => {
        const dbInner = new Database(filename, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(dbInner);
            }
        });
    });
    if (upScripts !== undefined && upScripts.length > 0) {
    // Run all scripts in sequence complete with error handling
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                let completedScripts = 0;
                for (const script of upScripts) {
                    db.run(script, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        completedScripts++;
                        if (completedScripts === upScripts.length) {
                            resolve(undefined);
                        }
                    });
                }
            });
        });
    }
    return db;
}

async function closeDB(db: Database) {
    await new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
}

export { buildDB, closeDB };
