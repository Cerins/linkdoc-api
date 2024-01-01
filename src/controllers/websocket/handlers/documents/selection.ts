import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';

const documentSelection:HandlerFn = errorHandler(async function(
    payload,
    type,
    acknowledge
) {
    // console.log('documentSelection', JSON.stringify(payload), type, acknowledge);
});

export default documentSelection;