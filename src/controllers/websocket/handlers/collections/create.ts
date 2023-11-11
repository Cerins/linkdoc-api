import { z } from 'zod';
import { HandlerFn } from '..';
import outputType from '../../utils/outputType';


// For this endpoint we need to return the list of collections that the user
// has
const payloadSchema = z.object({
    name: z.string()
});
const create: HandlerFn = async function(
    payload, type
) {
    const { name } = await payloadSchema.parseAsync(payload);
    const collection = await this.user.createCollection(name);
    // TODO handle the case where collection already exists
    this.emit(
        outputType(type, 'OK'),
        {
            id: collection.id,
            name: collection.name,
            owner: this.user.name,
            visibility: collection.visibility,
            description: collection.description
        }
    );
};

export default create;