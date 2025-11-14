import Database from '@nozbe/watermelondb/Database';
import {adapter} from './adapters/sqlite.adapter';
import {House} from './models/House';
import {Inspection} from './models/Inspection';

export const database = new Database({
  adapter,
  modelClasses: [House, Inspection],
});
