import { z } from 'zod';
import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { ColVisibility } from '../../../../app/gateways/interface/collection';
import collectionChecked from '../../utils/findCollection';

const payloadSchema = z.object({
    colUUID: z.string()
});

const collectionShareInfo: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { colUUID } = await payloadSchema.parseAsync(
        payload
    );
    const col = await collectionChecked(this, colUUID, ColVisibility.READ);
    const owner = col.userID === this.user.id;
    const answer = {
        owner,
        visibility: undefined as ColVisibility | undefined,
        users: undefined as { name: string, visibility: ColVisibility | undefined }[] | undefined,
        defaultDocument: col.defaultDocument
    };
    if(owner) {
        answer.visibility = col.visibility;
        // answer.users = await col.getUsers();
    }
    this.emit(outputType(type, 'OK'), answer, acknowledge);
});

export default collectionShareInfo;
