import { z } from 'zod';
import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { ColVisibility } from '../../../../app/gateways/interface/collection';
import collectionChecked from '../../utils/findCollection';
import RequestError from '../../utils/error/request';

const visibilitySchema = z.union([
    z.literal(ColVisibility.PRIVATE),
    z.literal(ColVisibility.READ),
    z.literal(ColVisibility.WRITE)
]);

const payloadSchema = z.object({
    colUUID: z.string(),
    users: z
        .array(
            z.object({
                name: z.string(),
                role: visibilitySchema
            })
        )
        .optional(),
    visibility: visibilitySchema.optional()
});

const collectionShare: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { colUUID, users, visibility } = await payloadSchema.parseAsync(
        payload
    );
    const col = await collectionChecked(this, colUUID, null, true);
    if (visibility !== undefined) {
        await col.setVisibility(visibility);
    }
    // Go through each user and set the access
    await Promise.all(
        (users ?? []).map(async ({ name, role }) => {
            const usr = await this.models.User.findOne({
                name
            });
            if (usr === undefined) {
                throw new RequestError({
                    type: 'BAD_REQUEST',
                    payload: {
                        errors: [
                            {
                                code: 'USER_NOT_FOUND',
                                message: 'user not found'
                            }
                        ]
                    }
                });
            }
            await col.setAccess(usr.id, role);
        })
    );
    this.emit(outputType(type, 'OK'), {}, acknowledge);
});

export default collectionShare;
