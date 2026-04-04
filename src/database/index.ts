import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema';
import House from './models/House';
import Inspection from './models/Inspections';
import InspectionPet from './models/InspectionPet';
import InspectionPoolCondition from './models/InspectionPoolCondition';
import InspectionBuildingCharacteristic from './models/InspectionBuildingCharacteristic';
import InspectionMedia from './models/InspectionsMedia';

// 1. Conectamos SQLite a nuestro esquema
const adapter = new SQLiteAdapter({
  schema: mySchema,
  // (Recomendado) Si la app se actualiza y cambias el schema, borra los datos viejos
  // dbName: 'dengueDB', // Opcional
  jsi: true, // Usa JSI para que sea ultra rápido en React Native
  onSetUpError: error => {
    console.log('Error inicializando base de datos', error);
  },
});

// 2. Creamos y exportamos la base de datos
export const database = new Database({
  adapter,
  modelClasses: [
    House, // Agregamos nuestro modelo aquí
    Inspection,
    InspectionPet,
    InspectionPoolCondition,
    InspectionBuildingCharacteristic,
    InspectionMedia,
  ],
});
