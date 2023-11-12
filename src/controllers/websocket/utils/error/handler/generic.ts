import { ISocketController, SocketControllerType } from '../../..';
import { HandlerFn } from '../../../handlers';
import outputType from '../../outputType';
import RequestError from '../request';

type ErrorHandlerPlugin = (err: unknown) => RequestError | null;

export default function genericErrorHandler(plugins: ErrorHandlerPlugin[]) {
    return function (fn: HandlerFn) {
        const originalFn = fn;
        const newFn: HandlerFn = async function (
            this: ISocketController,
            payload: unknown,
            type: string,
            acknowledge?: string
        ) {
            try {
                await originalFn.call(this, payload, type, acknowledge);
            } catch (error) {
                let cE = error;
                for (
                    let i = 0;
                    i < plugins.length && !(cE instanceof RequestError);
                    i++
                ) {
                    const plugin = plugins[i];
                    cE = plugin(cE) ?? cE;
                }
                if (!(cE instanceof RequestError)) {
                    cE = new RequestError({
                        type: 'SYS_ERROR',
                        payload: {},
                        log: {
                            reason: 'Could not find the plugin for error',
                            error: cE
                        }
                    });
                }
                const { type: resType, payload: resPayload, log } = cE as RequestError;
                const oType = outputType(type, resType);
                if (log) {
                    this.logger.log('error', 'Request error', {
                        type: oType,
                        payload: resPayload,
                        error: error,
                        ...log
                    });
                }
                this.emit(oType, resPayload, acknowledge);
            }
        };
        return newFn;
    };
}

export type { ErrorHandlerPlugin };
