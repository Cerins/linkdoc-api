import { z } from 'zod';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { HandlerFn } from '..';
import RequestError from '../../utils/error/request';

const payloadSchema = z.object({
    uuid: z.string()
});
const collectionDelete: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { uuid } = await payloadSchema.parseAsync(payload);
    const collection = await this.models.Collection.findOne({
        uuid
    });
    if(collection === undefined) {
        throw new RequestError({
            type: 'NOT_FOUND',
            payload: {},
            log: {
                uuid,
                reason: 'collection not found'
            }
        });
    }
    if(collection.userID !== this.user.id) {
        throw new RequestError({
            type: 'FORBIDDEN',
            payload: {},
            log: {
                reason: 'collection forbidden',
                uuid,
                userID: {
                    requested: collection.userID,
                    actual: this.user.id
                }
            }
        });
    }
    await collection.delete();
    this.emit(
        outputType(type, 'OK'),
        {},
        acknowledge
    );
});

export default collectionDelete;