import { ISocketController } from '..';
import { ColVisibility } from '../../../app/gateways/interface/collection';
import RequestError from './error/request';

export default async function collectionChecked(
    session: ISocketController,
    uuid: string,
    accessLevel: ColVisibility | null,
    creator?: boolean
) {
    const col = await session.models.Collection.findOne({
        uuid
    });
    if (col === undefined) {
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
    const forbiddenError = new RequestError({
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
    if (accessLevel !== null) {
        const hasAccess = await col.hasAccessLevel(accessLevel, session.user.id);
        if (!hasAccess) {
            throw forbiddenError;
        }
    }
    if (creator && session.user.id !== col.userID) {
        throw forbiddenError;
    }
    // Do not block the response handler because of metadata setting
    // The metadata collection does not affect the response so should not be
    // waited for in the event thread
    col.readBy(session.user.id).catch((err) => {
        session.logger.log('error', 'readBy error', {
            error: err
        });
    });
    return col;
}
