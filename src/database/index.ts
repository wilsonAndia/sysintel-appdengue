import Realm from 'realm';
import { realmConfig } from './realm';

let realmInstance: Realm | null = null;

export async function getRealm(): Promise<Realm> {
  if (!realmInstance) {
    realmInstance = await Realm.open(realmConfig);
  }
  return realmInstance;
}
