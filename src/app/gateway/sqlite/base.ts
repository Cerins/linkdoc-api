/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from 'knex';
import { MakeAllOptional, OnlyPrimitiveValues } from '../../../utils/types';

interface Dependencies {
  db: Knex;
}

/*
    Congrats! Welcome to 1995, you have just invented an ORM!
*/
export default function defineBaseGateway<T extends unknown & { id: string }>(
    dependencies: Dependencies,
    {
        physicalNames,
        tableName
    }: {
    physicalNames: Record<keyof OnlyPrimitiveValues<T>, string>;
    tableName: string;
  }
) {
  type B = OnlyPrimitiveValues<T>;
  type AllOptionalB = MakeAllOptional<B>;
  const { db } = dependencies;
  class Base {
      private _data = new Map<keyof B, B[keyof B]>();
      constructor() {
          (Object.keys(physicalNames) as (keyof B)[]).forEach((property) => {
              Object.defineProperty(this, property, {
                  get: () => {
                      const item = this._data.get(property);
                      if (item === undefined) {
                          throw new Error(`[${property.toString()}] undefined`);
                      }
                      return item;
                  },
                  set: (v) => {
                      if (property === 'id' && this._data.has(property)) {
                          throw new Error('[id] set');
                      }
                      this._data.set(property, v);
                  }
              });
          });
      }

      public link(linker: Record<keyof B, B[keyof B]>) {
          Object.entries(linker).forEach(([key, val]) => {
              (this as any)[key] = val;
          });
      }

      public async save() {
          const cid = this._data.get('id' as any);
          const fullRecord: Record<string, unknown> = {};
          Object.entries(physicalNames).forEach(([logical, physical]) => {
              if (logical === 'id') {
                  return;
              }
              const item = this._data.get(logical as any);
              if(item !== undefined) {
                  fullRecord[physical as any] = item;
              }
          });
          if (cid === undefined) {
              const id = await db(tableName).insert(fullRecord);
              (this as any).id = id[0].toString();
          } else {
              const physicalID = (physicalNames as any)['id'];
              await db(tableName)
                  .where({
                      [physicalID]: this as any
                  })
                  .update(fullRecord);
          }
      }

      public async delete() {
          await db(tableName).where({
              [(physicalNames as any)['id']]: (this as any).id
          });
      }

      public static async findAll(queryParams?: { where: AllOptionalB }) {
          let query = db(tableName);
          Object.entries(queryParams?.where ?? {}).forEach(([key, val]) => {
              if(val === undefined) { return; }
              query = query.where(physicalNames[key as keyof B], val as any);
          });
          query = query.select(
              Object.entries(physicalNames).map(([key, val]) => {
                  return `${val} as ${key}`;
              })
          );
          const itemsRefs = await query;
          return itemsRefs.map((ref) => {
              const item = new Base();
              item.link({
                  ...ref,
                  id: ref.id.toString()
              });
              return item;
          });
      }

      public static async findOne(queryParams?: { where: AllOptionalB }) {
          const items = await this.findAll(queryParams);
          if (items.length === 0) {
              return undefined;
          }
          return items[0];
      }
  }
  type FullT = OnlyPrimitiveValues<T> & {
    save(): Promise<void>;
    delete(): Promise<void>;
    link(): void;
  }
  return Base as unknown as {
    new (): T;
    findAll(queryParams?: { where?: AllOptionalB }): Promise<T[]>;
    findOne(queryParams?: { where?: AllOptionalB }): Promise<T | undefined>;
  };
}
