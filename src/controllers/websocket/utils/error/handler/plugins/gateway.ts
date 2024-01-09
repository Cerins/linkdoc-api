import GatewayError from '../../../../../../app/gateways/utils/error';
import RequestError from '../../request';
import { ErrorHandlerPlugin } from '../generic';

export const gateway: ErrorHandlerPlugin = (err) => {
    if(err instanceof GatewayError) {
        // Handle SQL unique constraint violation
        if(err.code === 'CONSTRAINT_VIOLATION') {
            return new RequestError({
                type: 'BAD_REQUEST',
                payload: {
                    message: 'item already exists',
                    code: 'DUPLICATE'
                },
                log: {
                    reason: 'Duplicate entry',
                    error: err
                }
            });
        }
    }
    return null;
};