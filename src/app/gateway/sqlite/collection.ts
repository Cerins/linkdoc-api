/* eslint-disable camelcase */
import { Knex } from 'knex';
import defineBaseGateway from './base';
import { ColVisibility, ICollectionGateway } from '../interface/collection';
import { v4 } from 'uuid';

interface Dependencies {
  db: Knex;
}
export default function defineCollectionGateway(dependencies: Dependencies) {
    const { db } = dependencies;
    const Base = defineBaseGateway<ICollectionGateway>(
        {
            db
        },
        {
            tableName: 'Collection',
            physicalNames: {
                id: 'colID',
                uuid: 'colUUID',
                name: 'colName',
                description: 'colDescription',
                createdAt: 'colCreatedAt',
                userID: 'col_usrID',
                visibility: 'colVisibility'
            }
        }
    );
    class Collection extends Base implements ICollectionGateway {
        public override async save() {
            (this as any).uuid = v4();
            await super.save();
        }
        public async hasAccessLevel(level: ColVisibility, usrID?: string) {
            // TODO
            // This method should not always consult with the database but instead
            // look at cache

            // Max collection access level is write
            const maxLevelAccess = ColVisibility.WRITE;
            // There are total 3 possible scenarios how the user might have access
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allScenarios: any[] = [
                // First the document might be open to the public
                // So th user should be able to see or edit publicly available collection
                db('Collection')
                    .select('colVisibility as visibility')
                    .where('colID', this.id)
            ];
            if (usrID) {
                allScenarios.push(
                    // Second user created the document
                    // So he should have max level access here
                    db
                        .select(db.raw('? as visibility', [maxLevelAccess]))
                        .from('Collection')
                        .where('colID', this.id)
                        .andWhere('col_usrID', usrID),
                    // The user might have been added to the document
                    // so it should be taken into consideration
                    db('UserCollection').select('uclVisibility as visibility').where({
                        ucl_colID: this.id,
                        ucl_usrID: usrID
                    })
                );
            }
            const allScenarioResult = db
                .union(allScenarios)
                .as('PossibleVisibilities');

            const maxVisibility = await db
                .select(db.raw('MAX(visibility) as visibility'))
                .from(allScenarioResult)
                .first();
            // It so happens that each next levels contains the allowance for previous levels
            // If that is not the case, this should be change
            return level <= maxVisibility['visibility'];
        }
    }
    return Collection;
}
