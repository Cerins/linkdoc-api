import { z } from 'zod';
import ResponseHelper, { IReq, IRes } from './utils/resHandler';
import async from './utils/handlePromise';
import JWT from '../../utils/jwt';
import { IUserType } from '../../app/models/interface/user';
import multer from 'multer';
import { v4 } from 'uuid';
import { Request, Response } from 'express';
import { ICollectionType } from '../../app/models/interface/collection';
import { ColVisibility } from '../../app/gateways/interface/collection';
import collectionChecked from './utils/findCollection';
import path from 'path';

interface Dependencies {
  models: {
    User: IUserType;
    Collection: ICollectionType;
  };
  config: {
    app: {
        model: {
            File: {
                dir: string;
            }
        }
    }
  }
}

const HTTResponse = new ResponseHelper({
    OK: {
        code: 200,
        description: 'Ok'
    },
    SYS_ERROR: {
        code: 500,
        description: 'System error happened'
    },
    AUTH_SUCCESS: {
        code: 200,
        description: 'Authentication successful'
    },
    AUTH_FAILED: {
        code: 401,
        description: 'Authentication failed'
    },
    FILE_TOO_BIG: {
        code: 413,
        description: 'File too big'
    },
    NO_FILE: {
        code: 400,
        description: 'No file'
    },
    FORBIDDEN: {
        code: 403,
        description: 'Forbidden'
    }

});

const loginBodySchema = z.object({
    username: z.string(),
    password: z.string(),
    remember: z.boolean().optional()
});

const fileUploadBodySchema = z.object({
    colUUID: z.string()
});

const fileDownloadPathParams = z.object({
    uuid: z.string()
});

/**
 * Check if the request has a session  - the server knows who the user is through a cookie
 */
function hasSession(req: IReq): req is IReq & { session: { usrID: string } } {
    return typeof req.session === 'object'
        && req.session !== null
        && 'usrID' in req.session
        && typeof req.session.usrID === 'string';
}

/**
 * Check if we can destroy the session
 */
function sessionDestroyAvailable(req: IReq):
 req is IReq & { session: { destroy: (cb: (err: unknown)=>void)=>void } } {
    return typeof req.session === 'object'
        && req.session !== null
        && 'destroy' in req.session
        && typeof req.session.destroy === 'function';
}

function defineHTTPController(dependencies: Dependencies) {
    const fileSizeLimit = 1024*1024*10; // 10MB TODO: Move to config
    // Check the config
    const storage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, dependencies.config.app.model.File.dir);
        },
        filename: (req, file, cb)=>{
            // Use uuid v4 to generate a random filename
            // Add the original extension to the end
            // So that the user knows what type of file it is
            const newFn = `${v4()}${path.extname(file.originalname)}`;
            cb(null, newFn);
        }
    });
    const upload = multer({
        storage: storage,
        limits: {
            fileSize: fileSizeLimit
        }
    }).single('file');
    class HTTPUserController {
        private constructor() {}

        @async()
        static async login(req: IReq, res: IRes, next: unknown) {
            const { User } = dependencies.models;
            const { username, password, remember } = await loginBodySchema.parseAsync(req.body);
            const user = await User.findOne({
                name: username
            });
            if (!user) {
                throw HTTResponse.error('AUTH_FAILED', undefined, {
                    username,
                    reason: 'User not found'
                });
            }
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                throw HTTResponse.error('AUTH_FAILED', undefined, {
                    username,
                    reason: 'Invalid password'
                });
            }
            // Potentially do not store the session
            if(remember) {
                (req.session as {
                usrID: string
                }).usrID = user.id;
            }
            const jwt = new JWT({
                usrID: user.id
            });
            HTTResponse.send(res, 'AUTH_SUCCESS', {
                token: jwt.sign()
            });
        }
        /**
         * Get JWT token for WS based on the current session
         */
        @async()
        static async session(req: IReq, res: IRes, next: unknown) {
            const { User } = dependencies.models;
            if(!hasSession(req)) {
                throw HTTResponse.error('AUTH_FAILED', undefined, {
                    reason: 'No session'
                });
            }
            const { usrID } = req.session;
            const user = await User.findOne({
                id: usrID
            });
            if (!user) {
                throw HTTResponse.error('AUTH_FAILED', undefined, {
                    usrID,
                    reason: 'User not found'
                });
            }
            const jwt = new JWT({
                usrID: user.id
            });
            HTTResponse.send(res, 'AUTH_SUCCESS', {
                token: jwt.sign(),
                name: user.name
            });
        }

        @async()
        static async logout(req: IReq, res: IRes, next: unknown) {
            if(
                sessionDestroyAvailable(req)
            ) {
                req.session.destroy((err: unknown)=>{
                    if(err) {
                        throw HTTResponse.error('SYS_ERROR', undefined, {
                            reason: 'Could not destroy session',
                            error: err
                        });
                    }
                    HTTResponse.send(res, 'OK');
                });
            } else {
                throw new Error('No session destroy');
            }
        }

        @async()
        static async fileUpload(rq: IReq, rs: IRes, next: unknown) {
            // Multer middleware uses express req and res types
            // Instead of stating the minimum requirements
            // So this has to be done to appease the typescript compiler
            const req = rq as unknown as Request;
            const res = rs as unknown as Response;
            const { logger } = rs.locals;
            return new Promise<void>((resolve, reject)=>{
                upload(req, res, (err)=>{
                    (async()=>{
                        if(err) {
                            // Detect if it was the file size that was too big
                            if(err instanceof multer.MulterError) {
                                if(err.code === 'LIMIT_FILE_SIZE') {
                                    throw HTTResponse.error('FILE_TOO_BIG', undefined, {
                                        reason: 'File too big',
                                        limit: fileSizeLimit
                                    });
                                }
                            }
                            throw err;
                        }
                        // Get the file uuid
                        if(!req.file) {
                            throw HTTResponse.error('NO_FILE', undefined, {
                                reason: 'File not uploaded'
                            });
                        }
                        if(!hasSession(req)) {
                            throw HTTResponse.error('FORBIDDEN', undefined, {
                                reason: 'No session'
                            });
                        }
                        const { colUUID } = await fileUploadBodySchema.parseAsync(req.body);
                        const { usrID } = req.session;
                        const col = await collectionChecked(
                            {
                                models: dependencies.models,
                                user: {
                                    id: usrID
                                },
                                logger

                            },
                            colUUID,
                            ColVisibility.WRITE
                        );
                        const { filename } = req.file;
                        // Create the file metadata
                        const uuid = await col.createFile(filename, usrID);
                        // Send the response
                        HTTResponse.send(rs, 'OK', {
                            uuid: uuid
                        });
                        resolve();
                    })().catch((e: unknown)=>{
                        reject(e);
                    });
                });
            });
        }

        @async()
        static async fileDownload(req: IReq, res: IRes, next: unknown) {
            const { Collection } = dependencies.models;
            // Check session
            if(!hasSession(req)) {
                throw HTTResponse.error('FORBIDDEN', undefined, {
                    reason: 'No session'
                });
            }
            const { usrID } = req.session;
            const { uuid } = await fileDownloadPathParams.parseAsync(req.params);
            // Then use the collection
            const col = await Collection.forFile(uuid);
            if(col === undefined) {
                throw HTTResponse.error('FORBIDDEN', undefined, {
                    reason: 'No collection found'
                });
            }
            // Check access
            const hasAccess = await col.hasAccessLevel(ColVisibility.READ, usrID);
            if(!hasAccess) {
                throw HTTResponse.error('FORBIDDEN', undefined, {
                    reason: 'Wrong access level'
                });
            }
            // Get the file
            const file = await col.readFile(uuid);
            if(file === undefined) {
                throw HTTResponse.error('FORBIDDEN', undefined, {
                    reason: 'File not found'
                });
            }
            // Send the file
            // Have to cast to because my res is not write stream
            // Set that the encoding is utf-8
            file.pipe(res);
        }
    }
    return HTTPUserController;
}

type HTTPUserControllerType = ReturnType<typeof defineHTTPController>;

export default defineHTTPController;
export type { HTTPUserControllerType };
