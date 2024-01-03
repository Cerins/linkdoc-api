import { describe, test, vi, expect, beforeEach } from 'vitest';
import PubSub from '../../../../../app/gateways/memory/pubsub';

const room1 = 'room1';
const room2 = 'room2';
const msg1 = 'msg1';
const msg2 = 'msg2';

const id1 = 'id1';
const id2 = 'id2';

//  These tests can actually be used for redis also
// since their interface is the same
// although running tests with outside systems
// is a "shady" thing, since the tests are run as multiple processes
// thus tests can be in an unstable state
describe('PubSub memory', ()=>{
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    let pubSub: PubSub;
    beforeEach(()=>{
        pubSub = new PubSub();
        cb1.mockClear();
        cb2.mockClear();
    });
    describe('publish', ()=>{
        test('no callback if not subscribed', ()=>{
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(0);
            expect(cb2).toBeCalledTimes(0);
        });
        test('callback if subscribed', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(1);
            expect(cb2).toBeCalledTimes(0);
            expect(cb1).toBeCalledWith(msg1);
        });
        test('callback only affect the subscribed room', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.subscribe(room2, id2, cb2);
            pubSub.publish(room1, msg1);
            pubSub.publish(room2, msg2);
            expect(cb1).toBeCalledTimes(1);
            expect(cb2).toBeCalledTimes(1);
            expect(cb1).toBeCalledWith(msg1);
            expect(cb2).toBeCalledWith(msg2);
        });
        test('send message to every user in the room', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.subscribe(room1, id2, cb2);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(1);
            expect(cb2).toBeCalledTimes(1);
            expect(cb1).toBeCalledWith(msg1);
            expect(cb2).toBeCalledWith(msg1);
        });
        test('send message every publish', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.publish(room1, msg1);
            pubSub.publish(room1, msg2);
            expect(cb1).toBeCalledTimes(2);
            expect(cb2).toBeCalledTimes(0);
            expect(cb1).toBeCalledWith(msg1);
            expect(cb1).toBeCalledWith(msg2);
        });
    });
    describe('subscribe', ()=>{
        test('still callback once if the id was subscribed multiple times', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.subscribe(room1, id1, cb1);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(1);
            expect(cb1).toBeCalledWith(msg1);
        });
        test('callback with the latest subscribed item', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.subscribe(room1, id1, cb2);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(0);
            expect(cb2).toBeCalledTimes(1);
            expect(cb2).toBeCalledWith(msg1);
        });
    });
    describe('unsubscribe', ()=>{
        test('unsubscribe', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.publish(room1, msg1);
            pubSub.unsubscribe(room1, id1);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(1);
            expect(cb1).toBeCalledWith(msg1);
        });
        test('still do nothing if calling unsubscribe on empty', ()=>{
            pubSub.subscribe(room1, id1, cb1);
            pubSub.publish(room1, msg1);
            pubSub.unsubscribe(room1, id1);
            pubSub.unsubscribe(room1, id1);
            pubSub.publish(room1, msg1);
            expect(cb1).toBeCalledTimes(1);
            expect(cb1).toBeCalledWith(msg1);
        });
    });
});