import { Model } from '@nozbe/watermelondb';
import {
  field,
  relation,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export default class InspectionMedia extends Model {
  static table = 'inspection_media';

  static associations = {
    inspections: { type: 'belongs_to', key: 'inspection_id' },
  } as const;

  @relation('inspections', 'inspection_id') inspection: any;

  @field('url') url!: string;
  @field('type') type!: string;
  @field('larvae_details') larvaeDetails?: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
