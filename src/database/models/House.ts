import Realm from 'realm';

export class House extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  backend_id?: string;
  neighborhood!: string;
  street!: string;
  number!: string;
  complement?: string;
  sector_id!: string;
  latitude!: number;
  longitude!: number;
  responsible!: string;
  subdomain_name?: string;
  sync_status!: string;
  updated_at!: Date;
  deleted_at?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'House',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      backend_id: 'string?',
      neighborhood: 'string',
      street: 'string',
      number: 'string',
      sector_id: 'string',
      complement: 'string?',
      latitude: 'double',
      longitude: 'double',
      responsible: 'string',
      subdomain_name: 'string?',
      sync_status: 'string',
      updated_at: 'date',
      deleted_at: 'date?',
      inspections: {
        type: 'linkingObjects',
        objectType: 'Inspection',
        property: 'house',
      },
    },
  };
}
