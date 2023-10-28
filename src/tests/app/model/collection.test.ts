import { beforeEach, describe, expect, test } from 'vitest';
import Models from '../../../app/model';
import SQLiteGateways from '../../../app/gateway/sqlite';
import { ColVisibility } from '../../../app/gateway/interface/collection';

const usrName = 'name';
const usrPassword = 'password';

const guestName = 'guest';
const guestPassword = 'pass';

const colName = 'col';

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
});
