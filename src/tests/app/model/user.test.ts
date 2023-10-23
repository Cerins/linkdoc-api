import UserMemoryGateway from '../../../app/gateway/memory/user';
import defineUser from '../../../app/model/user';
import { describe, test, expect, beforeEach } from 'vitest';

const usrInfo = {
    name: 'usrName',
    password: 'usrPassword'
};

describe('User tests', () => {
    const User = defineUser(
        {
            UserGateway: UserMemoryGateway
        },
        {
            saltRounds: 1
        }
    );
    beforeEach(async () => {
        const users = await UserMemoryGateway.findAll();
        await Promise.all(users.map((user) => user.delete()));
    });
    test('Trying to login with wrong password throws an error', async () => {
        await User.register(usrInfo.name, usrInfo.password);
        const usr = await User.find({
            name: usrInfo.name
        });
        expect(usr).toBeDefined();
        await expect(usr?.validatePassword('wrongPassword')).resolves.toBeFalsy();
    });
    test('Can register a new user', async () => {
        const a = await User.register(usrInfo.name, usrInfo.password);
        expect(a.name).toBe(usrInfo.name);
        expect(a.password).not.toBe(usrInfo.password);
        const b = await User.find(
            {
                name: usrInfo.name
            }
        );
        expect(b).toBeDefined();
        expect(b!.name).toBe(usrInfo.name);
        expect(b!.password).not.toBe(usrInfo.password);
        expect(b!.id).toBe(a.id);
        expect(b!.password).toBe(a.password);
        await expect(b!.validatePassword(usrInfo.password)).resolves.toBeTruthy();
    });
});
