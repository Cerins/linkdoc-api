/*
    Btw these tests will throw rejects after finishing there is nothing we can do much about it
*/
import { ILockGateway } from '../interface/lock';

interface InQueued {
  resolve: (value: ILockGateway | PromiseLike<ILockGateway>) => void;
  reject: (reason?: unknown) => void;
}


class Lock implements ILockGateway {
    item: string;
    private constructor(item: string) {
        this.item = item;
    }

    public async unlock() {
        Lock.freeLock(this.item);
    }

    private static lockQue = new Map<string, InQueued[]>();

    private static queEmpty(item: string) {
        return !this.lockQue.has(item);
    }

    private static quePush(item: string, value: InQueued) {
        const que = this.lockQue.get(item) ?? [];
        que.push(value);
        this.lockQue.set(item, que);
    }

    private static queUnshift(item: string, value: InQueued) {
        const que = this.lockQue.get(item) ?? [];
        que.unshift(value);
        this.lockQue.set(item, que);
    }

    private static queShift(item: string) {
        if (this.queEmpty(item)) {
            return null;
        }
        const que = this.lockQue.get(item)!;
        const value = que.shift()!;
        if (que.length === 0) {
            this.lockQue.delete(item);
        } else {
            this.lockQue.set(item, que);
        }
        return value;
    }

    private static grantLock(item: string) {
        return new Lock(item);
    }

    private static freeLock(item: string) {
        // Removes itself from que
        this.queShift(item);
        // Checks if there are some other items
        const other = this.queShift(item);
        if (other !== null) {
            // Put it back so there is still a que
            this.queUnshift(item, other);
            // Allow the resource to reverse this item
            other.resolve(this.grantLock(item));
        }
    }

    public static lock(item: string) {
        return new Promise<ILockGateway>((resolve, reject) => {
            const instantLock = this.queEmpty(item);
            this.quePush(item, {
                resolve,
                reject
            });
            if(instantLock) {
                resolve(this.grantLock(item));
            }
        });
    }

    // Rejects all the locks
    // Works only because reject doesnt do anything after resolve
    public static clear() {
        for(const [, val] of this.lockQue.entries()) {
            val.forEach(({ reject })=>{
                reject(new Error('lock cleared'));
            });
        }
        this.lockQue = new Map<string, InQueued[]>();
    }
}
export default Lock;

