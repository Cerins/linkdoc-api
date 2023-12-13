import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import Lock from '../../../../../app/gateways/memory/lock';

describe('Lock memory', ()=>{
    beforeEach(()=>{
        Lock.clear();
    });
    test('Instantly lock if no que', async ()=>{
        const log = vi.fn();
        const pr1 = Lock.lock('test');
        pr1.then(()=>log('pr1'));
        await pr1;
        expect(log).toHaveBeenCalledOnce();
        expect(log).toHaveBeenCalledWith('pr1');
    });
    test('Prevent lock if que', async ()=>{
        const log = vi.fn();
        const pr1 = Lock.lock('test');
        const pr2 = Lock.lock('test');
        pr1.then(()=>log('pr1'));
        await pr1;
        pr2.catch(()=>{});
        expect(log).toHaveBeenCalledOnce();
        expect(log).toHaveBeenCalledWith('pr1');
    });
    test('Do next item if unlocked', async ()=>{
        const log = vi.fn();
        const pr1 = Lock.lock('test');
        const pr2 = Lock.lock('test');
        pr1.then(()=>log('pr1'));
        pr2.then(()=>log('pr2'));
        const item = await pr1;
        const [_, item2] = await Promise.all([item.unlock(), pr2]);
        expect(log).toHaveBeenCalledTimes(2);
        expect(log).toHaveBeenCalledWith('pr1');
        expect(log).toHaveBeenCalledWith('pr2');
        await item2.unlock();

    });
    test('Instantly resolve if que was already cleared', async ()=>{
        const log = vi.fn();
        const pr1 = Lock.lock('test');
        pr1.then(()=>log('pr1'));
        const item = await pr1;
        await item.unlock();
        const pr2 = Lock.lock('test');
        pr2.then(()=>log('pr2'));
        const item2 = await pr2;
        expect(log).toHaveBeenCalledTimes(2);
        expect(log).toHaveBeenCalledWith('pr1');
        expect(log).toHaveBeenCalledWith('pr2');
        await item2.unlock();
    });
});