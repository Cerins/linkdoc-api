import { JSONValue } from '../../../utils/json';

export interface ICacheGateway {
  // Gets the cached value
  get(name: string, timeout?: number): Promise<JSONValue>;
  // Set the value which is stored in cached
  set(name: string, value: JSONValue, timeout?: number): Promise<void>;
}

export type ValueResolver = (name: string) => Promise<JSONValue>;
export type Backuper = (name: string, value: JSONValue) => Promise<void>;

export interface CacheOptions {
  resolver?: ValueResolver;
  backuper?: Backuper;
  namespace?: string;
  timeout?: number;
}

export interface CacheGatewayType {
  // TODO add description
  // Use https://www.npmjs.com/package/bowser as reference how to write proper JSDOC
  new (options?: CacheOptions): ICacheGateway;
  // Warning clears all keys
  reset (): Promise<void>
}
