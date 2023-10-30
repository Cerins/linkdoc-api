import { beforeEach, describe, expect, test } from 'vitest';
import Models from '../../../app/model';
import SQLiteGateways from '../../../app/gateway/sqlite';
import { ColVisibility } from '../../../app/gateway/interface/collection';
import async from '../../../controllers/http/utils/handlePromise';

const usrName = 'name';
const usrPassword = 'password';

const guestName = 'guest';
const guestPassword = 'pass';

const colName = 'col';
const othColName = 'not-col';

const docName = 'doc';
const othDocName = 'not-doc';

describe('Collection', () => {
    let models: Models;

    beforeEach(async () => {
        const gateway = await SQLiteGateways.create({
            log: () => {}
        });
        models = new Models({
            gateway
        });
    });

    describe('hasAccessLevel', () => {
        describe('User accessing his own collection', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const collection = await user.createCollection(colName);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    user.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Allow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const collection = await user.createCollection(colName);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    user.id
                );
                expect(hasAccess).toBe(true);
            });
        });
        describe('Guest not added to the collection', () => {
            test('Disallow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
            test('Disallow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
        });
        describe('Guest added to the collection, but removed', () => {
            test('Disallow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.PRIVATE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
            test('Disallow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.PRIVATE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
        });
        describe('Guest added to the collection with read', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.READ);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Disallow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.READ);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
        });
        describe('Guest added to the collection with write', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Allow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
        });
        describe('Guest not added but collection visibility is read', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setVisibility(ColVisibility.READ);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Disallow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setVisibility(ColVisibility.READ);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(false);
            });
        });
        describe('Guest not added but collection visibility is write', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setVisibility(ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Allow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setVisibility(ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
        });
        describe('Guest removed from collection, but visibility is write', () => {
            test('Allow read', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.PRIVATE);
                await collection.setVisibility(ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.READ,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
            test('Allow write', async () => {
                const user = await models.User.register(usrName, usrPassword);
                const guest = await models.User.register(guestName, guestPassword);
                const collection = await user.createCollection(colName);
                await collection.setAccess(guest.id, ColVisibility.PRIVATE);
                await collection.setVisibility(ColVisibility.WRITE);
                const hasAccess = await collection.hasAccessLevel(
                    ColVisibility.WRITE,
                    guest.id
                );
                expect(hasAccess).toBe(true);
            });
        });
    });
    describe('findDocument', ()=>{
        test('Return undefined if no document', async ()=>{
            const user = await models.User.register(usrName, usrPassword);
            const collection = await user.createCollection(colName);
            const doc = await collection.findDocument(docName);
            expect(doc).toBe(undefined);
        });
        test('Return document if document exists', async ()=>{
            const user = await models.User.register(usrName, usrPassword);
            const collection = await user.createCollection(colName);
            const docOg = await collection.createDocument(docName);
            const doc = await collection.findDocument(docName);
            expect(doc).not.toBe(undefined);
            expect(doc!.id).toBe(docOg.id);
        });
        test('Return undefined if document on other collection', async ()=>{
            const user = await models.User.register(usrName, usrPassword);
            const collection = await user.createCollection(colName);
            const collectionOth = await user.createCollection(othColName);
            const docOg = await collectionOth.createDocument(docName);
            const doc = await collection.findDocument(docName);
            expect(doc).toBe(undefined);
        });
    });
    describe('createDocument', ()=>{
        test('Throw error on duplicate', async ()=>{
            const user = await models.User.register(usrName, usrPassword);
            const collection = await user.createCollection(colName);
            await collection.createDocument(docName);
            expect.assertions(1);
            try{
                await collection.createDocument(docName);
            }catch(err){
                expect(err).toBeInstanceOf(Error);
            }
        });
    });
});
