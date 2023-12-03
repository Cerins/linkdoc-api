interface ILockGateway {
  // Unlock the locked resource
  unlock: () => Promise<void>;
}

interface LockGatewayType {
  // Waits until the lock is available
  // Then locks the item itself
  // returns an instance which is used to unlock the item
  lock: (item: string) => Promise<ILockGateway>;
}

export type { ILockGateway, LockGatewayType };
