type GatewayErrorCodes = 'CONSTRAINT_VIOLATION'

class GatewayError extends Error {
    public code: GatewayErrorCodes;

    constructor(code: GatewayErrorCodes, message?: string) {
        super(message);
        this.code = code;
    }
}

export default GatewayError;