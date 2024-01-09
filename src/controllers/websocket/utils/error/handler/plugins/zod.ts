import { ZodError } from 'zod';
import { ErrorHandlerPlugin } from '../generic';
import RequestError from '../../request';

export const zod: ErrorHandlerPlugin = (err) => {
    // Handle Zod schema mismatch
    if(err instanceof ZodError) {
        return new RequestError({
            type: 'BAD_REQUEST',
            payload: {
                message: 'schema mismatch',
                // errors: err.errors,
                code: 'SCHEMA_MISMATCH'
            },
            log: {
                reason: 'schema mismatch',
                zod: err
            }
        });
    }
    return null;
};