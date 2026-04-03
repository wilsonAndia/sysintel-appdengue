import { Model } from '@nozbe/watermelondb';
import {
  field,
  relation,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export default class InspectionPet extends Model {
  static table = 'inspection_pets';

  static associations = {
    inspections: { type: 'belongs_to', key: 'inspection_id' },
  } as const;

  @relation('inspections', 'inspection_id') inspection: any;
  @field('pet_type_id') petTypeId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
