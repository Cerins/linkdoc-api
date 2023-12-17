/* eslint-disable no-shadow */
import { Knex, QueryBuilder } from 'knex';
import {
    IUserGateway,
    getCollectionListArgs,
    getCollectionListReturn
} from '../interface/user';
import defineBaseGateway from './base';
interface Dependencies {
  db: Knex;
}

export default function defineUserGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<IUserGateway>(
        {
            db
        },
        {
            tableName: 'User',
            physicalNames: {
                id: 'usrID',
                name: 'usrName',
                password: 'usrPassword',
                createdAt: 'usrCreatedAt'
            }
        }
    );
    class User extends Base implements IUserGateway {
        public async getCollectionList(...args: getCollectionListArgs) {
            const limit = args[0]?.limit;
            const before = args[0]?.before;
            const { id } = this;
            let query = db
                .select('*')
                .from(function (this: Knex.QueryBuilder) {
                    this.select({
                        uuid: 'colUUID',
                        name: 'colName',
                        user: 'usrName',
                        defaultDocument: 'colDefaultDocument',
                        time: db.raw('MAX(CL.time)') })
                        .from(function (this: Knex.QueryBuilder) {
                            this.select({ colID: 'clo_colID', time: 'cloOpened' })
                                .from('CollectionOpened')
                                .where('clo_usrID', id)
                                .union(function (this: Knex.QueryBuilder) {
                                    this.select({ colID: 'colID', time: 'colCreatedAt' })
                                        .from('Collection')
                                        .where('col_usrID', id);
                                })
                                .as('CL');
                        })
                        .innerJoin('Collection', 'Collection.colID', 'CL.colID')
                        .innerJoin('User', 'Collection.col_usrID', 'User.usrID')
                        .groupBy('colUUID');
                })
                .orderBy('time', 'desc');
            if (before !== undefined) {
                query = query.where('time', '<', before);
            }
            query = query.orderBy('time', 'desc');
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            const res = (await query) as getCollectionListReturn;
            return res.map((v)=>({
                ...v,
                time: new Date(v.time)
            }));
        }
    }
    return User;
}
