
import { beforeEach, describe, expect, test } from 'vitest';
import Models from '../../../app/model';
import SQLiteGateways from '../../../app/gateway/sqlite';
import { IDocument, TransformType } from '../../../app/model/interface/document';

const usrName = 'name';
const usrPassword = 'password';

const colName = 'col';

const docName = 'doc';

// 2023.10.31 ??:?? RC: write tests for different users writting the same content
// 2023.10.31 21:37 RC: this is not needed
// ,since write to ducument is currently independent of account
// Funnily enough some user being allowed to write is a concept that handeled by
// controllers
// TODO Write tests whne OT is implemented

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
                        text: 'abc',
                        sid: 0
                    }
                });
                expect(document.text).toBe('abc');
            });
            test('Able to write at start', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc',
                        sid: 0
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: '123',
                        sid: 0
                    }
                });
                expect(document.text).toBe('123abc');
            });
            test('Able to write at the end', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc',
                        sid: 0
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 3,
                        text: '123',
                        sid: 0
                    }
                });
                expect(document.text).toBe('abc123');
            });
            test('Able to write at the middle', async()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: 'abc',
                        sid: 0
                    }
                });
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 1,
                        text: '123',
                        sid: 0
                    }
                });
                expect(document.text).toBe('a123bc');
            });
        });
        describe('ERASE', () => {
            beforeEach(async ()=>{
                await document.transform({
                    type: TransformType.WRITE,
                    payload: {
                        index: 0,
                        text: '0123456789',
                        sid: 0
                    }
                });
            });
            test('Erase from the start', async()=>{
                await document.transform({
                    type: TransformType.ERASE,
                    payload: {
                        index: 0,
                        count: 5,
                        sid: 0
                    }
                });
                expect(document.text).toBe('56789');
            });
            test('Erase from the end', async()=>{
                await document.transform({
                    type: TransformType.ERASE,
                    payload: {
                        index: 8,
                        count: 2,
                        sid: 0
                    }
                });
                expect(document.text).toBe('01234567');
            });
            test('Erase from the middle', async()=>{
                await document.transform({
                    type: TransformType.ERASE,
                    payload: {
                        index: 1,
                        count: 3,
                        sid: 0
                    }
                });
                expect(document.text).toBe('0456789');
            });
        });
    });
});
