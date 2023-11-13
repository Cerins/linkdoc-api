import { ISocketController } from '..';
import { ColVisibility } from '../../../app/gateway/interface/collection';
import RequestError from './error/request';

export default async function collectionChecked(
    session: ISocketController,
    uuid: string,
    accessLevel: ColVisibility | null
) {
    const col = await session.models.Collection.findOne({
        uuid
    });
    if(col === undefined) {
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
    if(accessLevel !== null) {
        const hasAccess = await col.hasAccessLevel(ColVisibility.READ, session.user.id);
        if(!hasAccess) {
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
    return col;
}