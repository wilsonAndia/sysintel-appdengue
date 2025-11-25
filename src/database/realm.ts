import Realm from 'realm';
import { House } from './models/House';
import { Inspection } from './models/Inspection';

export const realmConfig: Realm.Configuration = {
  schema: [House, Inspection],
  schemaVersion: 1,
};
