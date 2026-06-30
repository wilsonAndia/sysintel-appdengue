import { database } from '../index';
import { Q } from '@nozbe/watermelondb';
import uuid from 'react-native-uuid';

export interface InspectionPrefillData {
  numberOfAdults: string;
  numberOfChildren: string;
  underConstruction: boolean;
  constructionDetails: string;
  hasPets: boolean;
  petTypes: string[];
  hasPool: boolean;
  poolCondition: string[];
  buildingCharacteristics: string[];
  neighborCharacteristics: {
    neighbor1: string;
    neighbor2: string;
    neighbor3: string;
  };
}

export const getLastCompletedInspectionPrefill = async (
  houseId: string,
): Promise<InspectionPrefillData | null> => {
  const [lastInspection]: any[] = await database
    .get('inspections')
    .query(
      Q.where('house_id', houseId),
      Q.where('someone_at_home', true),
      Q.sortBy('inspection_date', Q.desc),
      Q.take(1),
    )
    .fetch();

  if (!lastInspection) return null;

  const [pets, poolConditions, buildingCharacteristics] = await Promise.all([
    lastInspection.pets.fetch(),
    lastInspection.poolConditions.fetch(),
    lastInspection.buildingCharacteristics.fetch(),
  ]);

  return {
    numberOfAdults: String(lastInspection.numberOfAdults ?? ''),
    numberOfChildren: String(lastInspection.numberOfChildren ?? ''),
    underConstruction: Boolean(lastInspection.underConstruction),
    constructionDetails: lastInspection.constructionDetails || '',
    hasPets: Boolean(lastInspection.hasPets),
    petTypes: lastInspection.hasPets
      ? pets.map((pet: any) => pet.petTypeId)
      : [],
    hasPool: Boolean(lastInspection.hasPool),
    poolCondition: lastInspection.hasPool
      ? poolConditions.map((pool: any) => pool.poolConditionTypeId)
      : [],
    buildingCharacteristics: buildingCharacteristics.map(
      (char: any) => char.buildingCharacteristicTypeId,
    ),
    neighborCharacteristics: {
      neighbor1: lastInspection.neighbor1 || '',
      neighbor2: lastInspection.neighbor2 || '',
      neighbor3: lastInspection.neighbor3 || '',
    },
  };
};

// 🍉 1. GUARDAR INSPECCIÓN: NO HABÍA NADIE
export const saveNoOneAtHomeInspection = async (
  houseId: string,
  userRedux: any,
  selectedZoneRedux: any,
  latitude: number,
  longitude: number,
  startTime: string | null,
) => {
  await database.write(async () => {
    const house = await database.get('houses').find(houseId);

    await database.get('inspections').create((i: any) => {
      i._raw.id = uuid.v4() as string; // UUID válido para PostgreSQL
      i.house.set(house);
      i.inspectorId = userRedux?.id || '';
      i.groupVisitId = selectedZoneRedux?.visitId || '';
      i.agentGroupId = selectedZoneRedux?.groupId || '';

      i.numberOfAdults = 0;
      i.numberOfChildren = 0;
      i.underConstruction = false;
      i.constructionDetails = '';
      i.someoneAtHome = false; // <-- LO IMPORTANTE

      i.latitude = latitude || 0;
      i.longitude = longitude || 0;
      i.startTime = startTime ? new Date(startTime) : new Date();
      i.endTime = new Date();
      i.inspectionDate = new Date();

      i.hasPets = false;
      i.hasPool = false;
      i.hasDengueFoci = false;
      i.completed = true;
    });
  });
};

// 🍉 2. GUARDAR INSPECCIÓN COMPLETA
export const saveFullInspection = async (
  houseId: string,
  userRedux: any,
  selectedZoneRedux: any,
  inspectionData: any, // Recibimos todo el estado del formulario aquí
) => {
  await database.write(async () => {
    // A. Buscamos la casa
    const house = await database.get('houses').find(houseId);

    // B. Creamos la Inspección
    const newInspection = await database.get('inspections').create((i: any) => {
      i._raw.id = uuid.v4() as string;
      i.house.set(house);
      i.inspectorId = userRedux?.id || '';
      i.groupVisitId = selectedZoneRedux?.visitId || '';
      i.agentGroupId = selectedZoneRedux?.groupId || '';

      i.numberOfAdults = Number(inspectionData.numberOfAdults || 0);
      i.numberOfChildren = Number(inspectionData.numberOfChildren || 0);
      i.underConstruction = inspectionData.underConstruction;
      i.constructionDetails = inspectionData.constructionDetails;
      i.someoneAtHome = inspectionData.someoneAtHome;

      i.latitude = inspectionData.latitude || 0;
      i.longitude = inspectionData.longitude || 0;
      i.startTime = inspectionData.startTime
        ? new Date(inspectionData.startTime)
        : new Date();
      i.endTime = new Date();
      i.inspectionDate = new Date();

      i.hasPets = inspectionData.hasPets;
      i.hasPool = inspectionData.hasPool;
      i.hasDengueFoci = inspectionData.hasDengueFoci;
      i.completed = true;

      i.neighbor1 = inspectionData.neighborCharacteristics.neighbor1;
      i.neighbor2 = inspectionData.neighborCharacteristics.neighbor2;
      i.neighbor3 = inspectionData.neighborCharacteristics.neighbor3;
    });

    // C. Mascotas
    for (const pet of inspectionData.petTypes) {
      await database.get('inspection_pets').create((p: any) => {
        p._raw.id = uuid.v4() as string;
        p.inspection.set(newInspection);
        p.petTypeId = pet;
      });
    }

    // D. Piscinas
    for (const pool of inspectionData.poolCondition) {
      await database.get('inspection_pool_conditions').create((p: any) => {
        p._raw.id = uuid.v4() as string;
        p.inspection.set(newInspection);
        p.poolConditionTypeId = pool;
      });
    }

    // E. Características de Construcción
    for (const char of inspectionData.buildingCharacteristics) {
      await database
        .get('inspection_building_characteristics')
        .create((c: any) => {
          c._raw.id = uuid.v4() as string;
          c.inspection.set(newInspection);
          c.buildingCharacteristicTypeId = char;
        });
    }

    // F. Multimedia
    for (const file of inspectionData.mediaFiles) {
      await database.get('inspection_media').create((m: any) => {
        m._raw.id = uuid.v4() as string;
        m.inspection.set(newInspection);
        m.url = file.uri;
        m.type = file.type.startsWith('image') ? 'image' : 'video';
        m.larvaeDetails = file.larvaeDetails;
        m.latitude = file.latitude;
        m.longitude = file.longitude;
      });
    }
  });
};
