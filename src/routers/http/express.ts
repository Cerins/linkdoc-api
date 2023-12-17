import express, { Router } from 'express';
import session from 'express-session';
import cors from 'cors';
import { ZodError } from 'zod';
import csrf from 'csurf';
import type { HTTPUserControllerType } from '../../controllers/http/user';
import ILogger from '../../utils/interface/logger';
import ResponseHelper, {
    INext,
    IReq,
    IRes,
    ReqError
} from '../../controllers/http/utils/resHandler';

interface Dependencies {
  controllers: {
    HTTPUserController: HTTPUserControllerType;
  };
  logger: ILogger;
  config: {
    cors: {
        origin: string
    },
    port: number;
    session: {
        secret: string
        cookie: {
            maxAge: number,
            secure: boolean
            httpOnly: boolean,
            sameSite: 'lax' | 'strict' | 'none'
        }
    }
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
        // Setup json body parser
        // TODO cors
        this.app.use(cors({
            methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
            credentials: true,
            origin: this.config.cors.origin
        }));
        this.app.use(express.json());
        // TODO use redis when appropriate
        this.app.use(session({
            secret: this.config.session.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                path: '/',
                ...this.config.session.cookie
            }
        }));
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
        const csrfProtection = csrf({ cookie: false });
        // Now why doesn't this route have CSRF protection?
        // Well it is rather simple, because it does not create a session
        // Instead it returns a JWT token that is used to connect to the websocket
        // And since malicious website can't read the token from the response,
        // (assuming the browser is enforcing the Same Origin Policy)
        // It can't use it to connect to the websocket
        this.app.post('/auth/login', HTTPUserController.login);
        this.app.post(
            '/auth/csrf',
            csrf({ cookie: false, ignoreMethods: ['POST'] }),
            (req, res) => {
                res.status(200).json({ data: { token: req.csrfToken() } });
            });
        // Apply CSRF protection to other routes
        this.app.use(csrfProtection);
        // Thinking about it, using CSRF protection is a bit overkill
        // Since /auth/session returns a JWT token
        // Which can't be read by malicious website
        // (assuming the browser is enforcing the Same Origin Policy)
        this.app.post('/auth/session', HTTPUserController.session);
        // Here is a legit use case for CSRF protection
        // Since I do not want a malicious website to log out the user
        this.app.post('/auth/logout', HTTPUserController.logout);
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
            this.logger.log(
                'info',
                `Express server started on port ${this.config.port}`
            );
        });
    }
}

export default ExpressAPI;
