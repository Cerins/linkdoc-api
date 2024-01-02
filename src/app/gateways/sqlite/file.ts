/* eslint-disable camelcase */
import { Knex } from 'knex';
import { v4 } from 'uuid';
import { FileGatewayType, IFileGateway } from '../interface/file';
import fs from 'fs';
import pathTransform from 'path';

interface Dependencies {
  db: Knex;
  config: {
    dir: string;
  }
}
export default function defineFileGateway(dependencies: Dependencies): FileGatewayType {
    const { db } = dependencies;
    class File implements IFileGateway {
        public uuid: string;
        public collectionID: string;
        public path: string;
        public usrID: string;
        private constructor(
            uuid: string,
            collectionID: string,
            path: string,
            usrID: string
        ) {
            this.uuid = uuid;
            this.collectionID = collectionID;
            this.path = path;
            this.usrID = usrID;
        }
        public stream() {
            // Use fs stream to stream the file content which is under dir as a path file
            const fullPath = pathTransform.join(dependencies.config.dir, this.path);
            // Check if the file exists
            if (!fs.existsSync(fullPath)) {
                throw new Error('File not found');
            }
            // Create and return a readable stream
            return fs.createReadStream(fullPath);
        }
        public static async register(
            path:string,
            {
                collectionID,
                usrID
            }: {
            collectionID: string;
            usrID: string;
        }) {
            const uuid = v4();
            await db('File')
                .insert({
                    fileUUID: uuid,
                    file_colID: collectionID,
                    filePath: path,
                    fileStorageType: 0,
                    file_usrID: usrID,
                    fileCreatedAt: new Date()
                });
            return new File(uuid, collectionID, path, usrID);
        }
        public static async find(uuid: string) {
            const file = await db('File')
                .select(
                    'fileUUID as uuid',
                    'file_colID as collectionID',
                    'filePath as path',
                    'file_usrID as usrID')
                .where('fileUUID', uuid)
                .first();
            if(file === undefined) {
                return undefined;
            }
            return new File(file.uuid, String(file.collectionID), file.path, String(file.usrID));
        }
    }
    return File;

}