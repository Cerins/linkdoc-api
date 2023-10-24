/*
    This is a large file which is used to setup the sqlite database.
    In case the database is empty

*/

const sqliteTableSetup = [
    `
        CREATE TABLE IF NOT EXISTS User (
            usrID INTEGER PRIMARY KEY,
            usrName TEXT NOT NULL UNIQUE,
            usrPassword TEXT NOT NULL,
            usrCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            usrUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    `
        CREATE TABLE IF NOT EXISTS Collection (
            colID INTEGER PRIMARY KEY,
            colName TEXT NOT NULL,
            colDescription TEXT,
            colCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            colUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `
];


const sqliteUserSetup: string[] = [
    // `
    //     INSERT INTO User (usrName, usrPassword)
    //     VALUES ("username", "password");
    // `
];

const sqliteSetupScripts = [
    ...sqliteTableSetup,
    ...sqliteUserSetup
];

export default sqliteSetupScripts;