import { HandlerFn } from '..';
import { ColVisibility } from '../../../../app/gateways/interface/collection';
import docRoom from '../../utils/documentRoom';
import errorHandler from '../../utils/error/handler';
import collectionChecked from '../../utils/findCollection';
import Server from '../../../../utils/ot/server';
import WrappedOperation from '../../../../utils/ot/wrapped-operation';
import TextOperation from '../../../../utils/ot/text-operation';
import Selection from '../../../../utils/ot/selection';
import { z } from 'zod';

// It just an array of objects that have a anchor and head properties
// Selection is also nullable
const selectionSchema = z.object(
    {
        ranges: z.array(
            z.object({
                anchor: z.number(),
                head: z.number()
            }))
    }
).nullable();

const revisionSchema = z.number().min(0);

// It array of unknown objects
const operationSchema = z.array(z.unknown());

const payloadSchema = z.object({
    docName: z.string(),
    colUUID: z.string(),
    revision: revisionSchema,
    operation: operationSchema,
    selection: selectionSchema
});

const documentOperation:HandlerFn = errorHandler(async function(
    payload
) {
    const {
        docName,
        colUUID,
        revision,
        operation,
        selection
    } = await payloadSchema.parseAsync(payload);
    const col = await collectionChecked(this, colUUID, ColVisibility.WRITE);
    const lock = await this.gateways.Lock.lock(`documents:${colUUID}:${docName}`);
    try {
        let doc = await col.findDocument(docName);
        if(doc === undefined) {
            doc = await col.createDocument(docName);
        }
        // TODO Potential redis usage problems
        // Look here if it a problem
        const past = (await doc.getOperations()).map(
            (op)=>{
                return new WrappedOperation(
                    TextOperation.fromJSON(op.operation),
                    op.meta && Selection.fromJSON(op.meta)
                );
            }
        );
        const server = new Server(doc.text, past);

        const clientID = this.sessionID;
        const wrapped = new WrappedOperation(
            TextOperation.fromJSON(operation),
            selection && Selection.fromJSON(selection)
        );
        const wrappedPrime = server.receiveOperation(revision, wrapped);
        this.emit(
            'DOC.ACK',
            {}
        );
        await doc.setText(server.document);
        // Redis And here also
        await doc.setOperations(server.operations.map((wo: any)=>{
            return {
                operation: wo.wrapped.toJSON(),
                meta: wo.meta
            };
        }));
        this.broadcastRoom(
            docRoom(colUUID, docName),
            'DOC.OPERATION.OK',
            {
                clientID,
                operation: wrappedPrime.wrapped.toJSON(),
                meta: wrappedPrime.meta
            }
        );
    } finally {
        await lock.unlock();
    }

});

export default documentOperation;