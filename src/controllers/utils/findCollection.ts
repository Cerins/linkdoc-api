import { ColVisibility } from '../../app/gateways/interface/collection';
import { ICollectionType } from '../../app/models/interface/collection';
import ILogger from '../../utils/interface/logger';
/**
 * Util function, so we don't have to perform the same checks over and over again
 */
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
    // No collection found
    if (col === undefined) {
        throw new Error('NOT_FOUND');
    }

    const forbiddenError = new Error('FORBIDDEN');
    if (accessLevel !== null) {
        const hasAccess = await col.hasAccessLevel(accessLevel, session.user.id);
        // No access, but needed - throw error
        if (!hasAccess) {
            throw forbiddenError;
        }
    }
    // The check for being the creator is active, but not the creator  - throw error
    if (creator && session.user.id !== col.userID) {
        throw forbiddenError;
    }
    return col;
}
