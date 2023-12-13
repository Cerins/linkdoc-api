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
    const documentForRes = {
        name: docName,
        text: ''
    };
    // Lock is needed to forbid document changes while someone is reading
    // Funny
    const lock = await this.gateways.Lock.lock(`documents:${docName}`);
    try{
        const doc = await col.findDocument(docName);
        if(doc !== undefined) {
            documentForRes.name = doc.name;
            documentForRes.text = doc.text;
        }
        this.join(docRoom(colUUID, docName));
        this.emit(
            outputType(type, 'OK'),
            documentForRes,
            acknowledge
        );
    } finally {
        await lock.unlock();
    }
});

export default documentRead;
