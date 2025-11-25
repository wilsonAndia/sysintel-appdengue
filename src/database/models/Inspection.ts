import Realm from 'realm';
import { House } from './House';

export class Inspection extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  house!: House;
  latitude!: number;
  longitude!: number;
  number_of_adults!: number;
  number_of_children!: number;
  someone_at_home!: boolean;
  under_construction!: boolean;
  construction_details?: string;
  has_pets!: boolean;
  has_pool!: boolean;
  has_dengue_foci!: boolean;
  completed!: boolean;
  start_time?: Date;
  end_time?: Date;
  inspector_id?: string;
  group_visit_id?: string;
  sync_status!: string;
  updated_at!: Date;
  deleted_at?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Inspection',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      house: 'House',
      latitude: 'double',
      longitude: 'double',
      number_of_adults: 'int',
      number_of_children: 'int',
      someone_at_home: 'bool',
      under_construction: 'bool',
      construction_details: 'string?',
      has_pets: 'bool',
      has_pool: 'bool',
      has_dengue_foci: 'bool',
      completed: 'bool',
      start_time: 'date?',
      end_time: 'date?',
      inspector_id: 'string?',
      group_visit_id: 'string?',
      sync_status: 'string',
      updated_at: 'date',
      deleted_at: 'date?',
    },
  };
}
