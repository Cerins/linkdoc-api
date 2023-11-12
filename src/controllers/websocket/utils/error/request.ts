type Log = Record<string, unknown> & {
  reason: string;
}

/**
 *
 * Allows to interrupt the flow of the handler and instantly stop the execution
 */
class RequestError {
    type: string;
    payload: unknown;
    log?: Log;
    constructor({
        type,
        payload,
        log
    }: {
    type: string;
    payload: unknown;
    log?: Log;
  }) {
        this.type = type;
        this.payload = payload;
        this.log = log;
    }
}

export default RequestError;
