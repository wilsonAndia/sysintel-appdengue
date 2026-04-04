import { database } from '../index'; // La ruta a tu archivo index.ts de WatermelonDB
import House from '../models/House';
import uuid from 'react-native-uuid'; // Para generar UUIDs válidos para tu PostgreSQL
import { Q } from '@nozbe/watermelondb';
export const saveHouseInWatermelonDB = async (houseData: any) => {
  // WatermelonDB requiere que toda escritura se haga dentro de un "action"
  await database.write(async () => {
    // Apuntamos a la colección de casas
    const housesCollection = database.get<House>('houses');

    // Creamos el registro localmente
    await housesCollection.create(house => {
      // Le forzamos un UUID válido (vital para evitar el error de PostgreSQL que tuvimos)
      house._raw.id = uuid.v4() as string;

      house.neighborhood = houseData.neighborhood;
      house.street = houseData.street;
      house.number = houseData.number;
      house.complement = houseData.complement || '';
      house.latitude = houseData.latitude;
      house.longitude = houseData.longitude;
      house.responsible = houseData.responsible;
      house.owner = houseData.owner;
      house.subdomain = houseData.subdomain || '';
      house.sectorId = houseData.sector_id || '';
    });
  });
};

export const observeHousesBySector = (sectorId: string) => {
  return database.collections
    .get<House>('houses')
    .query(Q.where('sector_id', sectorId))
    .observe(); // .observe() es la magia que lo hace reactivo
};
