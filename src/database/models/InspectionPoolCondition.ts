import { Model } from '@nozbe/watermelondb';
import {
  field,
  relation,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export default class InspectionPoolCondition extends Model {
  static table = 'inspection_pool_conditions';

  static associations = {
    inspections: { type: 'belongs_to', key: 'inspection_id' },
  } as const;

  @relation('inspections', 'inspection_id') inspection: any;
  @field('pool_condition_type_id') poolConditionTypeId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
