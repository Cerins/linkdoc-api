import { z } from 'zod';
import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import RequestError from '../../utils/error/request';
import { ColVisibility } from '../../../../app/gateway/interface/collection';

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
    const col = await this.models.Collection.findOne({
        uuid: colUUID
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
    const hasAccess = await col.hasAccessLevel(ColVisibility.READ, this.user.id);
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
    const documentForRes = {
        name: docName,
        text: ''
    };
    const doc = await col.findDocument(docName);
    if(doc !== undefined) {
        documentForRes.name = doc.name;
        documentForRes.text = doc.text;
    }
    this.emit(
        outputType(type, 'OK'),
        documentForRes,
        acknowledge
    );
});

export default documentRead;