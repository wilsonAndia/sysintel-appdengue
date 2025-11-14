import {Model} from '@nozbe/watermelondb';
import {field, relation, date} from '@nozbe/watermelondb/decorators';

export class Inspection extends Model {
  static table = 'inspections';

  @relation('houses', 'house_id') house!: any;

  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('number_of_adults') numberOfAdults!: number;
  @field('number_of_children') numberOfChildren!: number;
  @field('someone_at_home') someoneAtHome!: boolean;
  @field('under_construction') underConstruction!: boolean;
  @field('construction_details') constructionDetails!: string | null;
  @field('has_pets') hasPets!: boolean;
  @field('has_pool') hasPool!: boolean;
  @field('has_dengue_foci') hasDengueFoci!: boolean;
  @field('neighbor1') neighbor1!: string | null;
  @field('neighbor2') neighbor2!: string | null;
  @field('neighbor3') neighbor3!: string | null;
  @field('completed') completed!: boolean;
  @date('start_time') startTime!: Date | null;
  @date('end_time') endTime!: Date | null;
  @field('inspector_id') inspectorId!: string | null;
  @field('group_visit_id') groupVisitId!: string | null;
  @field('sync_status') syncStatusRaw!: string;
  @date('updated_at') updatedAt!: Date;
  @date('deleted_at') deletedAt!: Date | null;
}
