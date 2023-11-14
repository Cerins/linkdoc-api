import { HandlerFn } from '..';
import async from '../../../http/utils/handlePromise';
import errorHandler from '../../utils/error/handler';
import outputType from '../../utils/outputType';

const collectionShare: HandlerFn = errorHandler(async function (
    payload,
    type,
    acknowledge
) {
    this.emit(
        outputType(type, 'OK'),
        {},
        acknowledge
    );
});

export default collectionShare;