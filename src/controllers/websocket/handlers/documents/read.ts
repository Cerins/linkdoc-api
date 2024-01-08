import { z } from 'zod';
import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { ColVisibility } from '../../../../app/gateways/interface/collection';
import collectionChecked from '../../utils/findCollection';
import docRoom from '../../utils/documentRoom';

const payloadSchema = z.object({
    docName: z.string(),
    colUUID: z.string()
});

const documentRead: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { colUUID, docName } = await payloadSchema.parseAsync(payload);
    const col = await collectionChecked(this, colUUID, ColVisibility.READ);
    // Set read metadata
    await col.readBy(this.user.id);
    const documentForRes = {
        name: docName,
        text: '',
        visibility: await col.accessLevel(this.user.id)
    };
    // Lock is needed to forbid document changes while someone is reading
    // Funny
    const lock = await this.gateways.Lock.lock(`documents:${colUUID}:${docName}`);
    try{
        const doc = await col.findDocument(docName);
        if(doc !== undefined) {
            documentForRes.name = doc.name;
            documentForRes.text = doc.text;
        }
        this.join(docRoom(colUUID, docName));
        this.emit(
            outputType(type, 'OK'),
            {
                ...documentForRes,
                sid: doc === undefined ? 0 : await doc.revision()
            },
            acknowledge
        );
    } finally {
        await lock.unlock();
    }
});

export default documentRead;
