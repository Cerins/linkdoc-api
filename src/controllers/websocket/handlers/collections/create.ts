import { z } from 'zod';
import { HandlerFn } from '..';
import outputType from '../../utils/outputType';
import errorHandler from '../../utils/error/handler';
import RequestError from '../../utils/error/request';

const payloadSchema = z.object({
    name: z.string()
});

const create: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { name } = await payloadSchema.parseAsync(payload);
    // Name too short, bad request
    if (name.length < 1) {
        throw new RequestError({
            type: 'BAD_REQUEST',
            payload: {
                message: 'name too short',
                code: 'NAME_MIN'
            }
        });
    }
    // Name too long, bad request
    if (name.length >= 32) {
        throw new RequestError({
            type: 'BAD_REQUEST',
            payload: {
                message: 'name too long',
                code: 'NAME_MAX'
            }
        });
    }
    // If everything is fine, create the collection
    const collection = await this.user.createCollection(name);
    this.emit(
        outputType(type, 'OK'),
        {
            // Collection public id
            uuid: collection.uuid,
            // Its name
            name: collection.name,
            // Its owner
            user: this.user.name,
            visibility: collection.visibility,
            description: collection.description
        },
        acknowledge
    );
});

export default create;
