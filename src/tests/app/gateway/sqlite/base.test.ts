/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, vi, test, expect } from 'vitest';
import defineBaseGateway from '../../../../app/gateway/sqlite/base';

const tableName = 'Test';
const logicalID = 'id';
const physicalID = 'tstID';
const logicalProperty = 'test';
const phyisicalProperty = 'tstTest';


describe('Base gateway', ()=>{
    let Gateway: ReturnType<typeof defineBaseGateway>;
    const whereMock = vi.fn();

    const dbMock = vi.fn(()=>({
        where: whereMock
    })) as any;
    beforeEach(()=>{
        whereMock.mockClear();
        dbMock.mockClear();
        Gateway = defineBaseGateway<{ id: string, test: string}>({
            db: dbMock
        }, {
            tableName,
            physicalNames: {
                [logicalID]: physicalID,
                [logicalProperty]: phyisicalProperty
            }
        });
    });
    test('Call onto physicalID when delete is called', async()=>{
        const item = new Gateway();
        item.id = '5';
        await item.delete();
        expect(dbMock).toHaveBeenCalledOnce();
        expect(whereMock).toHaveBeenCalledOnce();
        expect(dbMock).toHaveBeenCalledWith(tableName);
        expect(whereMock).toHaveBeenCalledWith({
            [physicalID]: '5'
        });
    });
    test('Throw an error if property is not set when reading', async()=>{
        const item = new Gateway();
        expect.assertions(1);
        try{
            const { id } = item;
        }catch(err){
            expect(err).toBeInstanceOf(Error);
        }
    });
    test('Throw an error when setting already set id', async()=>{
        const item = new Gateway();
        item.id = '5';
        expect.assertions(1);
        try{
            item.id = '5';
        }catch(err){
            expect(err).toBeInstanceOf(Error);
        }
    });


});