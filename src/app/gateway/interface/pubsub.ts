type SubListener = (content: string) => void;

interface IPubSubGateway {
  publish: (room: string, content: string) => Promise<void>;
  // States that the user with id of ... wants to listen
  // using the given function
  subscribe: (room: string, id: string, listener: SubListener) => Promise<void>;
  // States that the user wants to remove the function that is associated
  // with it
  unsubscribe: (room: string, id: string) => Promise<void>;
}

interface PubSubGatewayType {
  new (): IPubSubGateway;
}

export type { IPubSubGateway, SubListener, PubSubGatewayType };
