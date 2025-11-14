import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {schema} from '../schema/schema';

export const adapter = new SQLiteAdapter({
  schema,
  dbName: 'field_inspections',
  jsi: true,
  onSetUpError: error => {
    console.error('Error configurando SQLite Adapter:', error);
  },
});
