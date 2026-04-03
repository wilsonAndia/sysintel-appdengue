import { Model } from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  children,
} from '@nozbe/watermelondb/decorators';

export default class House extends Model {
  static table = 'houses';

  static associations = {
    inspections: { type: 'has_many', foreignKey: 'house_id' },
  } as const;

  // El signo "!" le dice a TypeScript: "Confía en mí, esto no será null"
  @field('neighborhood') neighborhood!: string;
  @field('street') street!: string;
  @field('number') number!: string;

  // El signo "?" le dice a TypeScript que esto es opcional (puede ser undefined/null)
  @field('complement') complement?: string;

  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;

  @field('responsible') responsible!: string;
  @field('owner') owner!: boolean;

  @field('subdomain') subdomain?: string;
  @field('sector_id') sectorId?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('inspections') inspections: any;
}
