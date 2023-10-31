
import { beforeEach, describe, expect, test } from 'vitest';
import Models from '../../../app/model';
import SQLiteGateways from '../../../app/gateway/sqlite';
import { IDocument, TransformType } from '../../../app/model/interface/document';

const usrName = 'name';
const usrPassword = 'password';

const colName = 'col';

const docName = 'doc';

// TODO write tests for delete transorm
// TODO write tests for different users writting the same content

describe('Document', () => {
    let models: Models;
    let document: IDocument;

    beforeEach(async () => {
        const gateway = await SQLiteGateways.create({
            log: () => {}
        });
        models = new Models({
            gateway
        });
        const user = await models.User.register(usrName, usrPassword);
        const collection = await user.createCollection(colName);
        document = await collection.createDocument(docName);
    });

    describe('transform', () => {
        describe('WRTIE', () => {
            test('Able to write', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc'
                    }
                });
                expect(document.text).toBe('abc');
            });
            test('Able to write at start', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc'
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: '123'
                    }
                });
                expect(document.text).toBe('123abc');
            });
            test('Able to write at the end', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc'
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 3,
                        text: '123'
                    }
                });
                expect(document.text).toBe('abc123');
            });
            test('Able to write at the middle', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc'
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 1,
                        text: '123'
                    }
                });
                expect(document.text).toBe('a123bc');
            });
        });
    });
});
