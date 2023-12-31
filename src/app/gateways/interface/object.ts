/* eslint-disable no-unused-vars */
import { MakeAllOptional, OnlyPrimitiveValues } from '../../../utils/types';

interface IObjectGateway {
  readonly id: string;
  save(): Promise<void>;
  delete(): Promise<void>;
}

interface SearchQuery<T> {
    where?: MakeAllOptional<OnlyPrimitiveValues<T>>;
}

interface ObjectGatewayType<T extends IObjectGateway> {
  new (): T;
  findAll(
    query?: SearchQuery<T>
  ): Promise<T[]>;
  findOne(
    query?: SearchQuery<T>
  ): Promise<T | undefined>;
}

export type { IObjectGateway, ObjectGatewayType };
