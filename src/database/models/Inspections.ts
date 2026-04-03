import { Model } from '@nozbe/watermelondb';
import {
  field,
  date,
  relation,
  children,
  readonly,
} from '@nozbe/watermelondb/decorators';

export default class Inspection extends Model {
  static table = 'inspections';

  // ⚠️ Declaramos las relaciones para que WatermelonDB sepa cómo unirlas
  static associations = {
    houses: { type: 'belongs_to', key: 'house_id' },
    inspection_pets: { type: 'has_many', foreignKey: 'inspection_id' },
    inspection_pool_conditions: {
      type: 'has_many',
      foreignKey: 'inspection_id',
    },
    inspection_building_characteristics: {
      type: 'has_many',
      foreignKey: 'inspection_id',
    },
    inspection_media: { type: 'has_many', foreignKey: 'inspection_id' },
  } as const;

  // --- RELACIONES PADRE ---
  @relation('houses', 'house_id') house: any;

  // --- CAMPOS ---
  @field('inspector_id') inspectorId!: string;
  @field('group_visit_id') groupVisitId?: string;
  @field('agent_group_id') agentGroupId?: string;

  @field('number_of_adults') numberOfAdults!: number;
  @field('number_of_children') numberOfChildren!: number;
  @field('under_construction') underConstruction!: boolean;
  @field('construction_details') constructionDetails?: string;
  @field('someone_at_home') someoneAtHome!: boolean;

  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;

  @date('start_time') startTime?: Date;
  @date('end_time') endTime?: Date;
  @date('inspection_date') inspectionDate!: Date;

  @field('has_pets') hasPets!: boolean;
  @field('has_pool') hasPool!: boolean;
  @field('has_dengue_foci') hasDengueFoci!: boolean;
  @field('completed') completed!: boolean;

  @field('neighbor1') neighbor1?: string;
  @field('neighbor2') neighbor2?: string;
  @field('neighbor3') neighbor3?: string;

  // --- FECHAS DEL SISTEMA ---
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // --- RELACIONES HIJOS (SUB-TABLAS) ---
  @children('inspection_pets') pets: any;
  @children('inspection_pool_conditions') poolConditions: any;
  @children('inspection_building_characteristics') buildingCharacteristics: any;
  @children('inspection_media') media: any;
}
