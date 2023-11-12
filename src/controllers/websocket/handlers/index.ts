import type { ISocketController, IWebSocket } from '..';

type HandlerFn = (
    this: ISocketController,
    payload: unknown,
    type: string,
    acknowledge?: string,
) => Promise<void>;


export type { HandlerFn };