import express from 'express';
import type { IHTTPUserController } from '../../controllers/http/user';

import { ZodError } from 'zod';
import ILogger from '../../utils/interface/logger';
import ResponseHelper, {
    INext,
    IReq,
    IRes,
    ReqError
} from '../../controllers/http/utils/resHandler';

interface Dependencies {
  controllers: {
    HTTPUserController: IHTTPUserController;
  };
  logger: ILogger;
  config: {
    port: number;
  };
}

const GenericResponse = new ResponseHelper({
    SYSTEM_ERROR: {
        code: 500,
        description: 'Something went wrong'
    },
    BAD_REQUEST: {
        code: 400,
        description: 'Invalid parameters'
    },
    NOT_FOUND: {
        code: 404,
        description: 'Not found'
    }
});

class ExpressAPI {
    protected dependencies: Dependencies;
    protected app: express.Application;

    protected get logger() {
        return this.dependencies.logger;
    }

    protected get config() {
        return this.dependencies.config;
    }

    constructor(dependencies: Dependencies) {
        this.dependencies = dependencies;
        this.app = express();
        this.init();
    }
    protected init() {
        this.initMiddlewares();
        this.initRoutes();
        this.initErrorHandlers();
    }

    protected initMiddlewares() {
    // Setup logger middleware
        this.app.use((req, res, next) => {
            // Make so that the logger appends request info to the log
            const { logger } = this.dependencies;
            res.locals.logger = {
                log: (
                    level: 'info' | 'warn' | 'error',
                    message: string,
                    meta?: object
                ) => {
                    logger.log(level, message, {
                        request: {
                            method: req.method,
                            url: req.url,
                            // body: req.body,
                            // headers: req.headers,
                            ip: req.ip
                            // ips: req.ips
                        },
                        ...(meta || {})
                    });
                }
            };
            next();
        });
    }

    protected initRoutes() {
        const { HTTPUserController } = this.dependencies.controllers;
        this.app.post('/auth/login', HTTPUserController.login);
    }

    protected initErrorHandlers() {
    // Register not found handler
        this.app.use((req: IReq, res: IRes, next) => {
            const { logger } = res.locals;
            logger.log('warn', 'Not found');
            GenericResponse.send(res, 'NOT_FOUND');
        });
        this.app.use((err: Error, req: IReq, res: IRes, next: INext) => {
            const { logger } = res.locals;
            // logger.log('error', 'VERY LARGE ERROR');
            if (err instanceof ReqError) {
                const { code, message, description, data, log } = err;
                logger.log('error', 'Request error', {
                    error: {
                        code,
                        message,
                        description,
                        data
                    },
                    ...(log || {})
                });
                ResponseHelper.send(res, {
                    code,
                    message,
                    description,
                    data
                });
            } else if (err instanceof ZodError) {
                logger.log('error', 'Invalid request', {
                    error: {
                        name: err.name,
                        message: err.message,
                        errors: err.errors
                    }
                });
                GenericResponse.send(res, 'BAD_REQUEST');
            } else if (err instanceof Error) {
                logger.log('error', 'Internal server error', {
                    error: {
                        name: err.name,
                        message: err.message,
                        stack: err.stack
                    }
                });
                GenericResponse.send(res, 'SYSTEM_ERROR');
            } else {
                logger.log('error', 'Unknown error', {
                    error: err
                });
                GenericResponse.send(res, 'SYSTEM_ERROR');
            }
        });
    }

    public async start() {
        this.app.listen(this.config.port, () => {
            this.logger.log('info', `Express server started on port ${this.config.port}`);
        });
    }
}

export default ExpressAPI;
