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
            usrCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    // Choosing to add index to colName and col_usrID
    // Since searches happen more often than creations, futhermore
    // The col_usrID is important, since it is used for permission check and joins
    // name is used to search
    `
        CREATE TABLE IF NOT EXISTS Collection (
            colID INTEGER PRIMARY KEY,
            colUUID TEXT NOT NULL UNIQUE,
            colName TEXT NOT NULL,
            colDescription TEXT,
            col_usrID INTEGER NOT NULL,
            colVisibility TINYINT NOT NULL,
            colCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (col_usrID)
            REFERENCES User(usrID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE(colName, col_usrID)
        );
    `,
    `
        CREATE INDEX IF NOT EXISTS idx_colName ON Collection(colName);
    `,
    `
        CREATE INDEX IF NOT EXISTS idx_col_usrID ON Collection(col_usrID);
    `,
    `
        CREATE TABLE IF NOT EXISTS UserCollection (
            uclID INTEGER PRIMARY KEY,
            ucl_usrID INTEGER NOT NULL,
            ucl_colID INTEGER NOT NULL,
            uclCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uclVisibility TINYINT NOT NULL,
            FOREIGN KEY (ucl_usrID)
            REFERENCES User(usrID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            FOREIGN KEY (ucl_colID)
            REFERENCES Collection(colID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE(ucl_usrID, ucl_colID)
        )
    `,
    `
        CREATE TABLE IF NOT EXISTS Document (
            docID INTEGER PRIMARY KEY,
            docName TEXT NOT NULL,
            docText TEXT NOT NULL,
            doc_colID INTERGER NOT NULL,
            FOREIGN KEY (doc_colID)
            REFERENCES Collection(colID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE(docName, doc_colID)
        )
    `,
    `
        CREATE INDEX IF NOT EXISTS idx_doc_colID on Document(doc_colID);
    `,
    `
        CREATE INDEX IF NOT EXISTS idx_docName on Document(docName);
    `,
    `
        CREATE TABLE IF NOT EXISTS CollectionOpened (
            cloID INTEGER PRIMARY KEY,
            clo_usrID INTEGER NOT NULL,
            clo_docID INTEGER NOT NULL,
            cloCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cloOpened TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (clo_usrID)
            REFERENCES User(usrID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            FOREIGN KEY (clo_docID)
            REFERENCES Collection(colID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE(clo_usrID, clo_docID)
        )
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