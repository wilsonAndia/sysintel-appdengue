import { Model } from '@nozbe/watermelondb';
import {
  field,
  relation,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export default class InspectionBuildingCharacteristic extends Model {
  static table = 'inspection_building_characteristics';

  static associations = {
    inspections: { type: 'belongs_to', key: 'inspection_id' },
  } as const;

  @relation('inspections', 'inspection_id') inspection: any;
  @field('building_characteristic_type_id')
  buildingCharacteristicTypeId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
