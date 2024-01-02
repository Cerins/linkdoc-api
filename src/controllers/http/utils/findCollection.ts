import collectionCheckedInner from '../../utils/findCollection';
import ResponseHelper from './resHandler';

// Use the same args as in the original function
type Args = Parameters<typeof collectionCheckedInner>;

const COLResponse = new ResponseHelper({
    COL_NOT_FOUND: {
        code: 404,
        description: 'Collection not found'
    },
    FORBIDDEN: {
        code: 403,
        description: 'No access'
    }
});

export default async function collectionChecked(
    ...args: Args
) {
    const [session, uuid, accessLevel, creator] = args;
    try{
        return (await collectionCheckedInner(session, uuid, accessLevel, creator));
    } catch(err) {
        if(err instanceof Error) {
            if(err.message === 'NOT_FOUND') {
                throw COLResponse.error('COL_NOT_FOUND', {}, {
                    reason: 'collection not found'
                });
            }
            if(err.message === 'FORBIDDEN') {
                throw COLResponse.error('FORBIDDEN', {}, {
                    reason: 'no access to collection'
                });
            }
        }
        throw err;
    }
}
