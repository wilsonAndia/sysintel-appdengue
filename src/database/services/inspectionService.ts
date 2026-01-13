import Realm from 'realm';
import { getRealm } from '../index';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { fetchAxiosToken } from '../../helpers/fetchAxiosToken';

import { Inspection } from '../models/Inspection';

interface MediaData {
  uri: string;
  type: string;
  name: string;
  larvaeDetails: string;
  latitude: number;
  longitude: number;
}

interface InspectionLocalData {
  houseId: string;
  someoneAtHome: boolean;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  completed: boolean;

  numberOfAdults?: number;
  numberOfChildren?: number;
  underConstruction?: boolean;
  constructionDetails?: string;
  hasDengueFoci?: boolean;
  hasPets?: boolean;
  pets?: string[];
  hasPool?: boolean;
  poolConditions?: string[];
  buildingCharacteristics?: string[];
  neighbor1?: string;
  neighbor2?: string;
  neighbor3?: string;
  mediaFiles?: MediaData[];
}

export async function saveInspectionLocal(data: InspectionLocalData) {
  const realm = await getRealm();

  realm.write(() => {
    realm.create('Inspection', {
      _id: new Realm.BSON.ObjectId(),
      house_id: data.houseId,
      sync_status: 'pending',
      created_at: new Date(),
      completed: data.completed,
      someoneAtHome: data.someoneAtHome,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime,
      endTime: data.endTime,

      numberOfAdults: data.numberOfAdults || 0,
      numberOfChildren: data.numberOfChildren || 0,
      underConstruction: data.underConstruction || false,
      constructionDetails: data.constructionDetails || '',
      hasDengueFoci: data.hasDengueFoci || false,
      hasPets: data.hasPets || false,
      hasPool: data.hasPool || false,

      pets_json: JSON.stringify(data.pets || []),
      poolConditions_json: JSON.stringify(data.poolConditions || []),
      buildingCharacteristics_json: JSON.stringify(
        data.buildingCharacteristics || [],
      ),
      neighbor1: data.neighbor1 || '',
      neighbor2: data.neighbor2 || '',
      neighbor3: data.neighbor3 || '',

      media_json: JSON.stringify(data.mediaFiles || []),
    });
  });

  console.log('📝 Inspección guardada localmente (offline).');
}

export async function getPendingInspections() {
  const realm = await getRealm();

  return realm
    .objects<Inspection>('Inspection')
    .filtered('sync_status = "pending"');
}

async function getPresignedUrl(fileName: string, mimeType: string) {
  const token = await AsyncStorage.getItem('token');
  const res = await axios.get(`${API_URL}inspections/media/upload-url`, {
    params: { fileName, contentType: mimeType },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { url: string; key: string };
}

async function uploadFileToS3(
  uri: string,
  mimeType: string,
  signedUrl: string,
) {
  const resp = await fetch(uri);
  const blob = await resp.blob();
  const result = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });
  if (!result.ok) throw new Error('Error al subir archivo a S3');
}

export async function syncPendingInspections(
  subdomain: string,
  idGroupVisit?: string,
  idAgentGroup?: string,
) {
  const pending = await getPendingInspections();
  const realm = await getRealm();

  if (pending.length === 0) return;

  console.log(`🔄 Sincronizando ${pending.length} inspecciones...`);

  const inspectionsToSync = Array.from(pending);

  for (const inspection of inspectionsToSync) {
    try {
      let realHouseId = inspection.house_id;

      try {
        if (
          typeof inspection.house_id === 'string' &&
          /^[a-f\d]{24}$/i.test(inspection.house_id)
        ) {
          const houseObjectId = new Realm.BSON.ObjectId(inspection.house_id);
          const houseLocal = realm.objectForPrimaryKey('House', houseObjectId);

          if (houseLocal && houseLocal.backend_id) {
            realHouseId = String(houseLocal.backend_id);
          } else if (houseLocal && !houseLocal.backend_id) {
            console.warn(
              '⚠️ Casa no sincronizada. Saltando inspección...',
              inspection._id,
            );
            continue;
          }
        }
      } catch (e) {
        realHouseId = inspection.house_id;
      }

      const localMedia = JSON.parse(inspection.media_json || '[]');
      const finalMediaForBackend = [];

      for (const file of localMedia) {
        if (
          file.uri.startsWith('file://') ||
          file.uri.startsWith('content://')
        ) {
          console.log('📤 Subiendo imagen:', file.name);
          try {
            const { url: signedUrl, key } = await getPresignedUrl(
              file.name,
              file.type,
            );
            await uploadFileToS3(file.uri, file.type, signedUrl);

            finalMediaForBackend.push({
              url: key,
              type: file.type.includes('video') ? 'video' : 'image',
              larvaeDetails: file.larvaeDetails,
              latitude: file.latitude,
              longitude: file.longitude,
            });
          } catch (err) {
            console.error('Error subiendo foto, saltando archivo:', err);
          }
        } else {
          finalMediaForBackend.push(file);
        }
      }

      const payload = {
        houseId: realHouseId,
        idGroupVisit: idGroupVisit,
        idAgentGroup: idAgentGroup,
        startTime: inspection.startTime,
        endTime: inspection.endTime,
        latitude: inspection.latitude,
        longitude: inspection.longitude,
        someoneAtHome: inspection.someoneAtHome,

        numberOfAdults: inspection.numberOfAdults,
        numberOfChildren: inspection.numberOfChildren,
        underConstruction: inspection.underConstruction,
        constructionDetails: inspection.constructionDetails,

        hasDengueFoci: inspection.hasDengueFoci,
        hasPets: inspection.hasPets,
        hasPool: inspection.hasPool,

        pets: JSON.parse(inspection.pets_json || '[]'),
        poolConditions: JSON.parse(inspection.poolConditions_json || '[]'),
        buildingCharacteristics: JSON.parse(
          inspection.buildingCharacteristics_json || '[]',
        ),

        neighbor1: inspection.neighbor1,
        neighbor2: inspection.neighbor2,
        neighbor3: inspection.neighbor3,

        media: finalMediaForBackend,
      };

      console.log('🚀 Enviando payload unificado...');

      const response = await fetchAxiosToken({
        url: 'inspections/sync',
        method: 'post',
        body: payload,
        subdomain,
      });
      console.log(response);
      if (response.statusCode === 201 || response.id) {
        const backendId = response.payload?.id || response.id;

        realm.write(() => {
          const itemToUpdate = realm.objectForPrimaryKey<Inspection>(
            'Inspection',
            inspection._id,
          );
          if (itemToUpdate) {
            itemToUpdate.sync_status = 'synced';
            itemToUpdate.backend_id = backendId;
          }
        });
        console.log('✅ Sincronizado OK:', backendId);
      } else {
        console.error('❌ Error Backend:', response);
      }
    } catch (error) {
      console.error('❌ Falló sync de inspección:', error);
    }
  }
}
