import type { ISocketController, IWebSocket } from '..';

type HandlerFn = (
    this: ISocketController,
    payload: unknown,
    ws: IWebSocket,
    next: (err: unknown) => void
) => void;


export type { HandlerFn };