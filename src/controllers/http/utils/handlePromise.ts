import { INext, IReq, IRes } from './resHandler';

export default function async() {
    // The target will controllers
    // which gets req, res and next
    // if any error occurs, call next with the error
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (
            this: unknown,
            req: IReq,
            res: IRes,
            next: INext
        ) {
            try {
                await originalMethod.apply(this, [req, res, next]);
            }
            catch (error) {
                next(error);
            }
        };
    };
}

