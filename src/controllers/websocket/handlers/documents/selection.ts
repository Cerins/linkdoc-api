import { HandlerFn } from '..';
import errorHandler from '../../utils/error/handler';

const documentSelection:HandlerFn = errorHandler(async function(
    payload,
    type,
    acknowledge
) {
    // Currently does nothing
    // In the future, it will be used to see what other users are selecting
    // console.log('documentSelection', JSON.stringify(payload), type, acknowledge);
});

export default documentSelection;