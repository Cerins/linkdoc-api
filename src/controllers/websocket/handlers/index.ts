import type { ISocketController, IWebSocket } from '..';

type HandlerFn = (
    this: ISocketController,
    payload: unknown,
    type: string,
    next: (err: unknown) => void
) => Promise<void>;


export type { HandlerFn };