import { ISocketController } from '../../..';
import { HandlerFn } from '../../../handlers';
import genericErrorHandler, { ErrorHandlerPlugin } from './generic';
import { gateway as gatewayPlugin } from './plugins/gateway';
import { zod as zodPlugin } from './plugins/zod';

export default function errorHandler(
    fn: HandlerFn,
    plugins?: ErrorHandlerPlugin[]
){
    const geh = genericErrorHandler(
        [
            ...(plugins ?? []),
            gatewayPlugin,
            zodPlugin
        ]
    );
    return geh(fn);
}