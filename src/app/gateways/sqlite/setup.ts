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
            usrCreatedAt TIMESTAMP NOT NULL
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
            colDescription TEXT NULL,
            col_usrID INTEGER NOT NULL,
            colVisibility TINYINT NOT NULL,
            colDefaultDocument TEXT NULL,
            colCreatedAt TIMESTAMP NOT NULL,
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
            uclCreatedAt TIMESTAMP NOT NULL,
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
            clo_colID INTEGER NOT NULL,
            cloCreatedAt TIMESTAMP NOT NULL,
            cloOpened TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (clo_usrID)
            REFERENCES User(usrID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            FOREIGN KEY (clo_colID)
            REFERENCES Collection(colID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE(clo_usrID, clo_colID)
        )
    `,

    // File table is used to store the file under the document
    // The file is created by the user and there is no certain way to store
    // So there is an integer key that describes the storage type
    // And a field that stores the path to the file
    // Quite sad the file prefix is used, instead of 3 letter prefix
    // But this makes it easier to read
    `
        CREATE TABLE IF NOT EXISTS File (
            fileID INTEGER PRIMARY KEY,
            fileUUID TEXT NOT NULL UNIQUE,
            fileStorageType INTEGER NOT NULL,
            filePath TEXT NULL,
            fileBlob BLOB NULL,
            file_docID INTEGER NOT NULL,
            file_usrID INTEGER NOT NULL,
            fileCreatedAt TIMESTAMP NOT NULL,
            FOREIGN KEY (file_docID)
            REFERENCES Document(docID)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            FOREIGN KEY (file_usrID)
            REFERENCES User(usrID)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        )
    `,
    // Index on file_docID and file_usrID since they will potentially searched by
    // Potentially remove these if they are not used
    `
            CREATE INDEX IF NOT EXISTS idx_file_docID on File(file_docID);
    `,
    `
            CREATE INDEX IF NOT EXISTS idx_file_usrID on File(file_usrID);
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
