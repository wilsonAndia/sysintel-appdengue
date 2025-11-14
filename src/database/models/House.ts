// src/database/models/House.ts
import {Model} from '@nozbe/watermelondb';
import {field, date, children} from '@nozbe/watermelondb/decorators';
import {Inspection} from './Inspection';

export class House extends Model {
  static table = 'houses';

  @field('neighborhood') neighborhood!: string;
  @field('street') street!: string;
  @field('number') number!: string;
  @field('complement') complement!: string | null;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('responsible') responsible!: string;
  @field('subdomain_name') subdomainName!: string;
  @field('sync_status') syncStatusRaw!: string;

  @date('updated_at') updatedAt!: Date;
  @date('deleted_at') deletedAt!: Date | null;

  @children('inspections') inspections!: Inspection[];
}
