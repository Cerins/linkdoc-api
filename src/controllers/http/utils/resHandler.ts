import ILogger from '../../../utils/interface/logger';

interface IReq {
  body: unknown;
  params: unknown;
  query: unknown;
  session: unknown
}

type LogData = {
  reason: string;
} & {
  [key: string]: unknown;
};

type IRes = NodeJS.WritableStream & {
  json: (data: unknown) => void;
  status: (code: number) => IRes;
  locals: {
    logger: ILogger;
  };
}

interface INext {
  (error?: unknown): void;
}

/**
 * @description
 * Error that happens when handling http requests
 */
class ReqError extends Error {
    public code: number;

    public message: string;

    public description: string;

    public data?: unknown;

    public log?: LogData;

    /*
    Although this constructor has 5 parameters, which is unpleasant.
    It is good to remember that error is only thrown through ResponseHelper.error
    method which has less parameters.
    */
    constructor(
        code: number,
        message: string,
        description: string,
        data?: unknown,
        log?: LogData
    ) {
        super(message);
        this.code = code;
        this.message = message;
        this.description = description;
        this.data = data;
        this.log = log;
    }
}

/**
 * @description
 * Create instance that have a collection of response codes
 * and a method to send response to client
 * @example
 * const response = new Response({
 *    AUTH_SUCCESS: {
 *       code: 200,
 *      description: 'Authentication successful'
 *   }
 * });
 * response.send(res, 'AUTH_SUCCESS', {});
 * @template T the allowed response messages
 * @param responseCodes the collection of response codes
 */
// eslint-disable-next-line no-use-before-define
class ResponseHelper<T extends string> {
    private responseCodes: Record<
    T,
    {
      code: number;
      description: string;
    }
  >;
    public constructor(
        responseCodes: Record<
      T,
      {
        code: number;
        description: string;
      }
    >
    ) {
        this.responseCodes = responseCodes;
    }

    protected getResponseCode(code: T) {
        if (!this.responseCodes[code]) {
            throw new Error(`Response code ${code} not found`);
        }
        return this.responseCodes[code];
    }

    public static send(
        res: IRes,
        {
            code,
            message,
            description,
            data
        }: {
      code: number;
      message: string;
      description: string;
      data?: unknown;
    }
    ) {
        res.status(code).json({
            message,
            description,
            data
        });
    }

    public send(res: IRes, code: T, data?: unknown) {
        const { code: responseCode, description } = this.getResponseCode(code);
        ResponseHelper.send(res, {
            code: responseCode,
            message: code,
            description,
            data
        });
    }
    public error(code: T, data?: unknown, log?: LogData) {
        const { code: responseCode, description } = this.getResponseCode(code);
        return new ReqError(responseCode, code, description, data, log);
    }
}

export default ResponseHelper;
export { ReqError };
export type { IReq, IRes, INext };
