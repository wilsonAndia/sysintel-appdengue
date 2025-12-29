import Realm from 'realm';

export class Inspection extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  backend_id?: string; // ID del backend si ya se sincronizó
  house_id!: string; // ID de la casa (puede ser local o de backend)

  // Datos de control
  sync_status!: string; // 'pending' | 'synced'
  created_at!: Date;
  completed!: boolean;
  someoneAtHome!: boolean;

  // Datos del formulario
  latitude!: number;
  longitude!: number;
  startTime?: string;
  endTime?: string;

  numberOfAdults?: number;
  numberOfChildren?: number;
  underConstruction?: boolean;
  constructionDetails?: string;

  hasDengueFoci?: boolean;
  hasPets?: boolean;
  hasPool?: boolean;

  // Arrays guardados como JSON String para simplificar en Realm
  pets_json?: string; // string[] stringified
  poolConditions_json?: string; // string[] stringified
  buildingCharacteristics_json?: string; // string[] stringified
  neighbor1?: string;
  neighbor2?: string;
  neighbor3?: string;

  // Archivos multimedia (JSON stringified)
  // Guardará: { uri: string, type: string, larvaeDetails: string, latitude, longitude }
  media_json?: string;

  static schema: Realm.ObjectSchema = {
    name: 'Inspection',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      backend_id: 'string?',
      house_id: 'string', // Clave foránea manual

      sync_status: 'string',
      created_at: 'date',
      completed: { type: 'bool', default: false },
      someoneAtHome: { type: 'bool', default: true },

      latitude: 'double',
      longitude: 'double',
      startTime: 'string?',
      endTime: 'string?',

      numberOfAdults: 'int?',
      numberOfChildren: 'int?',
      underConstruction: 'bool?',
      constructionDetails: 'string?',

      hasDengueFoci: 'bool?',
      hasPets: 'bool?',
      hasPool: 'bool?',

      pets_json: 'string?',
      poolConditions_json: 'string?',
      buildingCharacteristics_json: 'string?',
      neighbor1: 'string?',
      neighbor2: 'string?',
      neighbor3: 'string?',

      media_json: 'string?', // Array de objetos multimedia
    },
  };
}
