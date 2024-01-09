import { z } from 'zod';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';
import { HandlerFn } from '..';

const collectionRead: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    // Get the list of users collections
    const collectionList = await this.user.getCollectionList();
    this.emit(
        outputType(type, 'OK'),
        {
            collections: collectionList
        },
        acknowledge
    );
});

export default collectionRead;
