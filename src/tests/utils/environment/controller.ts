//
import { vi } from 'vitest';
import defineSocketController from '../../../controllers/websocket';
import SQLiteGateways from '../../../app/gateway/sqlite';
import Models from '../../../app/model';
import { HandlerFn } from '../../../controllers/websocket/handlers';
export function createWebSocketMock() {
    return {
        on: vi.fn(),
        send: vi.fn()
    };
}

export function createWebSocketServerMock() {
    return {
        emit: vi.fn(),
        handleUpgrade: vi.fn()
    };
}

export function createSocketMock() {
    return {
        on: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        removeListener: vi.fn(),
        headers: [],
        remoteAddress: ''
    };
}

export function createHeadMock() {
    return null;
}

export function createLoggerMock() {
    return {
        log: vi.fn()
    };
}
export default async function createControllerEnvironment(
    dependencies:
    {
        baseUrl: string,
        users: {
            name: string,
            password: string
        }[]
        handlers?: {
            name:string
            fn: HandlerFn
        }[]
    }
){
    const loggerMock = createLoggerMock();
    const gateways = await SQLiteGateways.create(loggerMock);
    const models = new Models({
        gateways
    });
    const users = await Promise.all(
        dependencies.users.map(({ name, password })=>models.User.register(name, password))
    );
    const WSWebsocketController = defineSocketController({
        config: {
            baseUrl: dependencies.baseUrl
        },
        models,
        logger: loggerMock,
        gateways
    });
    (dependencies.handlers ?? []).forEach(({
        name, fn
    })=>{
        WSWebsocketController.registerHandler(name, fn);
    });
    return {
        baseUrl: dependencies.baseUrl,
        loggerMock,
        WSWebsocketController,
        users
    };
}

export type ControllerEnvironment = Awaited<ReturnType<typeof createControllerEnvironment>>
