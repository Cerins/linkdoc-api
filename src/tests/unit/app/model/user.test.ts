import SQLiteGateways from '../../../../app/gateways/sqlite';
import Models from '../../../../app/models';
import { IUserType } from '../../../../app/models/interface/user';
import { describe, test, expect, beforeEach } from 'vitest';

const usrInfo = {
    name: 'usrName',
    password: 'usrPassword'
};

describe('User', () => {
    let User!: IUserType;
    beforeEach(async () => {
        const gateways = await SQLiteGateways.create({
            log: () => {}
        });
        const models = new Models({
            gateways
        });
        // eslint-disable-next-line prefer-destructuring
        User = models.User;
    });
    test('Trying to login with wrong password throws an error', async () => {
        await User.register(usrInfo.name, usrInfo.password);
        const usr = await User.findOne({
            name: usrInfo.name
        });
        expect(usr).toBeDefined();
        await expect(usr?.validatePassword('wrongPassword')).resolves.toBeFalsy();
    });
    test('Can register a new user', async () => {
        const a = await User.register(usrInfo.name, usrInfo.password);
        expect(a.name).toBe(usrInfo.name);
        const b = await User.findOne({
            name: usrInfo.name
        });
        expect(b).toBeDefined();
        expect(b!.name).toBe(usrInfo.name);
        expect(b!.id).toBe(a.id);
        await expect(b!.validatePassword(usrInfo.password)).resolves.toBeTruthy();
    });
});
