import { JSONValue } from '../../../utils/json';
import {
    Backuper,
    CacheGatewayType,
    CacheOptions,
    ICacheGateway,
    ValueResolver
} from '../interface/cache';

const Cache: CacheGatewayType = class CacheInner implements ICacheGateway {
    private resolver?: ValueResolver;

    private timeout?: number;

    private backuper?: Backuper;

    private namespace?: string;

    private static cached = new Map<
    string,
    {
      value: JSONValue;
      name: string;
      timeout: ReturnType<typeof setInterval> | null;
    }
  >();

    public constructor(options?: CacheOptions) {
        this.resolver = options?.resolver;
        this.timeout = options?.timeout;
        this.backuper = options?.backuper;
        this.namespace = options?.namespace;
    }

    private fullName(name: string) {
        if (this.namespace === undefined) {
            return name;
        }
        return `${this.namespace}:${name}`;
    }

    public async set(
        name: string,
        value: JSONValue,
        timeout?: number | undefined
    ): Promise<void> {
        const fname = this.fullName(name);
        const actualTimeout = timeout ?? this.timeout ?? null;
        // Then we check if there is ongoing timeout
        const cached = CacheInner.cached.get(fname);
        const currentTimeout = cached?.timeout ?? null;
        // If there is then we need to cancel it
        if (currentTimeout !== null) {
            clearTimeout(currentTimeout);
        }
        CacheInner.cached.set(fname, {
            value,
            name,
            timeout:
        actualTimeout === null
            ? null
            : setTimeout(() => {
                this.cleanup(name);
            }, actualTimeout)
        });
    }

    // Remove the value
    private async cleanup(name: string) {
        const fname = this.fullName(name);
        // Check if there is a backuper( a way of moving the item to non-volatile storage)
        const cached = CacheInner.cached.get(fname)!;
        if (this.backuper) {
            await this.backuper(name, cached.value);
        }
        CacheInner.cached.delete(fname);
    }

    public static async reset() {
        CacheInner.cached.clear();
    }

    public async get(
        name: string,
        timeout?: number | undefined
    ): Promise<JSONValue> {
        const fname = this.fullName(name);
        const has = CacheInner.cached.has(fname);
        if(has) {return CacheInner.cached.get(fname)!.value;}
        if (this.resolver) {
            // First we resolve
            const value = await this.resolver(name);
            // Then we set this value
            this.set(name, value, timeout);
            // And then we return
            return value;
        }
        return null;
    }
};

export default Cache;
