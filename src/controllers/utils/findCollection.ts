import { ColVisibility } from '../../app/gateways/interface/collection';
import { ICollectionType } from '../../app/models/interface/collection';
import ILogger from '../../utils/interface/logger';

export default async function collectionChecked(
    session: {
        models: {
            Collection: ICollectionType;
        };
        user: {
            id: string;
        };
        logger: ILogger
    },
    uuid: string,
    accessLevel: ColVisibility | null,
    creator?: boolean
) {
    const col = await session.models.Collection.findOne({
        uuid
    });
    if (col === undefined) {
        throw new Error('NOT_FOUND');
    }
    const forbiddenError = new Error('FORBIDDEN');
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
