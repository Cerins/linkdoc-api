import { z } from 'zod';
import { HandlerFn } from '..';
import outputType from '../../utils/outputType';
import errorHandler from '../../utils/error/handler';
import RequestError from '../../utils/error/request';

// For this endpoint we need to create a collection
// has
const payloadSchema = z.object({
    name: z.string()
});
const create: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { name } = await payloadSchema.parseAsync(payload);
    // TODO move this to config
    if (name.length < 1) {
        throw new RequestError({
            type: 'BAD_REQUEST',
            payload: {
                message: 'name too short',
                code: 'NAME_MIN'
            }
        });
    }
    if (name.length >= 32) {
        throw new RequestError({
            type: 'BAD_REQUEST',
            payload: {
                message: 'name too long',
                code: 'NAME_MAX'
            }
        });
    }
    const collection = await this.user.createCollection(name);
    this.emit(
        outputType(type, 'OK'),
        {
            uuid: collection.uuid,
            name: collection.name,
            user: this.user.name,
            visibility: collection.visibility,
            description: collection.description
        },
        acknowledge
    );
});

export default create;
