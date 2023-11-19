import { z } from 'zod';
import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { ColVisibility } from '../../../../app/gateway/interface/collection';
import collectionChecked from '../../utils/findCollection';
import { TransformType } from '../../../../app/model/interface/document';
import docRoom from '../../utils/documentRoom';

const payloadSchema = z.object({
    docName: z.string(),
    colUUID: z.string(),
    payload: z.object({
        index: z.number().int().gte(0),
        sid: z.number(),
        text: z.string()
    })
});

const documentWrite: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    const { colUUID, docName, payload: docPayload } = await payloadSchema.parseAsync(payload);
    const col = await collectionChecked(this, colUUID, ColVisibility.WRITE);
    let doc = await col.findDocument(docName);
    if(doc === undefined) {
        doc = await col.createDocument(docName);
    }
    const transform =  await doc.transform({
        type: TransformType.WRITE,
        payload: docPayload
    });
    this.emitRoom(
        docRoom(colUUID, docName),
        outputType(type, 'OK'),
        {
            colUUID,
            docName,
            transform
        },
        acknowledge
    );
});

export default documentWrite;
