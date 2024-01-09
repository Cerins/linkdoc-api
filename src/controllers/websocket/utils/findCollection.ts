import RequestError from './error/request';
import collectionCheckedInner from '../../utils/findCollection';

// Use the same args as in the original function
type Args = Parameters<typeof collectionCheckedInner>;

// Wrapped to throw RequestError instead of Error
export default async function collectionChecked(
    ...args: Args
) {
    const [session, uuid, accessLevel, creator] = args;
    try{
        return (await collectionCheckedInner(session, uuid, accessLevel, creator));
    } catch(err) {
        if(err instanceof Error) {
            if(err.message === 'NOT_FOUND') {
                throw new RequestError({
                    type: 'NOT_FOUND',
                    payload: {
                        errors: [
                            {
                                code: 'COL_NOT_FOUND',
                                message: 'collection not found'
                            }
                        ]
                    }
                });
            }
            if(err.message === 'FORBIDDEN') {
                throw new RequestError({
                    type: 'FORBIDDEN',
                    payload: {
                        errors: [
                            {
                                code: 'FORBIDDEN',
                                message: 'no access'
                            }
                        ]
                    },
                    log: {
                        reason: 'no access to collection'
                    }
                });
            }
        }
        throw err;
    }
}
