/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from 'knex';
import { MakeAllOptional, OnlyPrimitiveValues } from '../../../utils/types';
import GatewayError from '../utils/error';

interface Dependencies {
  db: Knex;
}

/**
 * A class which implements the basic functionality of a SQL gateway
 * Such as create, update, delete, find
 * @param dependencies Knex
 * @param param1 The logical to physical name mapping and the table name
 * @returns A base class which can be extended to create a gateway
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
          this._data.set('createdAt' as any, (new Date()) as any);
          (Object.keys(physicalNames) as (keyof B)[]).forEach((property) => {
              // Define the property
              // So that accessing it will return the value from the map
              // And setting it will set the value in the map
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

      /**
       * Take a key value pair and store it in the map
       * @param linker takes logical values and stores them in the map
       */
      public link(linker: Record<keyof B, B[keyof B]>) {
          if(linker === null) {return;}
          Object.entries(linker).forEach(([key, val]) => {
              (this as any)[key] = val;
          });
      }
      /**
       * Allows to save the current state of the object to the database
       * If the object has an id, then it will update the record
       * Otherwise it will create a new record
       */
      public async save() {
          const cid = this._data.get('id' as any);
          // TODO It should noted, that update sets every field
          // This is not optimal, even if the sql server ignores unneeded changes
          // still more useless bytes are transferred over the network
          // I should update this class so that is saves which fields where updated or set
          const fullRecord: Record<string, unknown> = {};
          // We can not store JS dates in the database
          // So ISO string is used
          function itemToValue(item: unknown) {
              if(item instanceof Date) {
                  return item.toISOString();
              }
              return item;
          }
          // We need to prepare the knex query
          // So we take our logical mapping and convert it to physical
          Object.entries(physicalNames).forEach(([logical, physical]) => {
              if (logical === 'id') {
                  return;
              }
              const item = this._data.get(logical as any);
              if(item !== undefined) {
                  fullRecord[physical as any] = itemToValue(item);
              }
          });
          if (cid === undefined) {
              // Create a new record
              try{
                  const id = await db(tableName).insert(fullRecord);
                  (this as any).id = id[0].toString();
                  // Iterate over the fields that were not set and simply state them as null
                  // TODO this causes issues with values that get defaulted by the db
                  // but currently ignore this
                  Object.entries(physicalNames).forEach(([logical]) => {
                      const item = this._data.get(logical as any);
                      if(item === undefined) {
                          (this as any)[logical] = null;
                      }
                  });
              } catch(err: unknown) {
                  if(
                      typeof err === 'object'
                        && err !== null
                        && 'code' in err
                        && err.code === 'SQLITE_CONSTRAINT'
                  ) {
                      // This is the case where the values are not unique
                      throw new GatewayError('CONSTRAINT_VIOLATION', 'sqlite constraint violation');
                  }
                  throw err;
              }
          } else {
              // Update the record
              const physicalID = (physicalNames as any)['id'];
              await db(tableName)
                  .where({
                      [physicalID]: cid
                  })
                  .update(fullRecord);
          }
      }

      public async delete() {
          // Find an instance of the record
          // and delete it
          await db(tableName).where({
              [(physicalNames as any)['id']]: (this as any).id
          }).del();
      }

      // TODO currently all fields are returned
      // Why?
      // I mean if there would be no need to write additional code, then field select is preferable
      // Since it decreases the constraint on the db
      // Furthermore the sql server can do optimizations
      // Queries that only look at certain fields can be optimized quite better
      // than queries which receive a full dataset
      // So in the future please fix this
      // by the ability of passing the set of interested fields,
      // they should be logical and would be under queryParams
      // like so { where: {....}, attributes: new Set()}
      // thanks
      public static async findAll(this: any, queryParams?: { where: AllOptionalB }) {
          let query = db(tableName);
          // Build a select query
          Object.entries(queryParams?.where ?? {}).forEach(([key, val]) => {
              if(val === undefined) { return; }
              query = query.where(physicalNames[key as keyof B], val as any);
          });
          // Convert the physical names to logical

          query = query.select(
              // This is fine because the physicalNames are created by the developer
              // and are not user input
              Object.entries(physicalNames).map(([key, val]) => {
                  return `${val} as ${key}`;
              })
          );
          const itemsRefs = await query;
          return itemsRefs.map((ref) => {
              const item = new this();
              item.link({
                  ...ref,
                  id: ref.id.toString()
              });
              return item;
          });
      }
      // TODO theoretically this should  execute a different query
      // since getting the entire selection and then discarding is stupid
      public static async findOne(queryParams?: { where: AllOptionalB }) {
          const items = await this.findAll(queryParams);
          if (items.length === 0) {
              return undefined;
          }
          return items[0];
      }
  }
  type FullT = T & {
    save(): Promise<void>;
    delete(): Promise<void>;
    link(): void;
  }
  return Base as unknown as {
    new (): FullT;
    findAll(queryParams?: { where?: AllOptionalB }): Promise<FullT[]>;
    findOne(queryParams?: { where?: AllOptionalB }): Promise<FullT | undefined>;
  };
}
