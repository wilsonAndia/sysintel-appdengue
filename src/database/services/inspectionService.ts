import Realm from 'realm';
import { getRealm } from '../index';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { fetchAxiosToken } from '../../helpers/fetchAxiosToken';
import { Inspection } from '../models/Inspection';

// === Tipos de Datos ===
interface MediaData {
  uri: string;
  type: string;
  name: string;
  larvaeDetails: string;
  latitude: number;
  longitude: number;
}

interface InspectionLocalData {
  _id?: Realm.BSON.ObjectId; // ID Local de Realm (opcional al crear)
  backend_id?: string | null; // ID del Backend (si existe)
  houseId: string;
  someoneAtHome: boolean;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime?: string;
  completed: boolean;
  sync_status?: 'pending' | 'synced' | 'in_progress'; // Nuevo estado
  idGroupVisit: string;
  idAgentGroup: string;
  created_at: Date;
  // Campos opcionales
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

// =======================================================
// 1. START BEST EFFORT (Híbrido)
// =======================================================
export async function startInspectionService(data: {
  houseId: string;
  latitude: number;
  longitude: number;
  idGroupVisit: string;
  idAgentGroup: string;
  startTime: string;
  subdomain: string;
  someoneAtHome: boolean; // Generalmente true al iniciar, o false si no hay nadie
}) {
  const realm = await getRealm();
  let backendId: string | null = null;
  const localId = new Realm.BSON.ObjectId();

  // A. Intento Online ("Fire and Forget")
  try {
    const response = await fetchAxiosToken({
      url: 'inspections/start',
      method: 'post',
      body: {
        house: { id: data.houseId },
        latitude: data.latitude,
        longitude: data.longitude,
        idGroupVisit: data.idGroupVisit,
        idAgentGroup: data.idAgentGroup,
        startTime: data.startTime,
        someoneAtHome: data.someoneAtHome,
      },
      subdomain: data.subdomain,
    });

    if (response && response.id) {
      backendId = response.id;
      console.log('✅ Start Online OK. Backend ID:', backendId);
    }
  } catch (error) {
    console.log('⚠️ Start Offline. Se guardará localmente sin Backend ID.');
  }

  // B. Guardado Local (Siempre ocurre)
  realm.write(() => {
    realm.create('Inspection', {
      _id: localId,
      backend_id: backendId, // Si falló internet, esto es null
      house_id: data.houseId,
      sync_status: 'in_progress', // Marcamos como en progreso
      created_at: new Date(),
      completed: false,
      someoneAtHome: data.someoneAtHome,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime,
      idGroupVisit: data.idGroupVisit,
      idAgentGroup: data.idAgentGroup,

      // Valores por defecto
      media_json: '[]',
      pets_json: '[]',
      poolConditions_json: '[]',
      buildingCharacteristics_json: '[]',
    });
  });

  return { localId, backendId };
}

// =======================================================
// 2. SAVE / UPDATE LOCAL
// =======================================================
export async function saveInspectionLocal(data: InspectionLocalData) {
  const realm = await getRealm();

  realm.write(() => {
    let existing: Inspection | null = null;

    if (data._id) {
      existing = realm.objectForPrimaryKey<Inspection>('Inspection', data._id);
    }

    const payload = {
      // Si no existe, crea ID nuevo. Si existe, mantiene el suyo.
      _id: existing ? existing._id : new Realm.BSON.ObjectId(),
      backend_id: data.backend_id || existing?.backend_id || null,
      house_id: data.houseId,
      sync_status: 'pending', // Pasa a pendiente de sync
      completed: data.completed,
      someoneAtHome: data.someoneAtHome,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime,
      endTime: data.endTime,
      idGroupVisit: data.idGroupVisit,
      idAgentGroup: data.idAgentGroup,
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
    };

    realm.create('Inspection', payload, Realm.UpdateMode.Modified);
  });

  console.log('📝 Inspección guardada/actualizada localmente.');
}

// =======================================================
// 3. SYNC ENGINE (Lógica Completa)
// =======================================================

// Auxiliares de S3 (Igual que tenías)
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

export async function getPendingInspections() {
  const realm = await getRealm();
  return realm
    .objects<Inspection>('Inspection')
    .filtered('sync_status = "pending"');
}

export async function syncPendingInspections(subdomain: string) {
  const pending = await getPendingInspections();
  const realm = await getRealm();

  if (pending.length === 0) return;

  console.log(`🔄 Sincronizando ${pending.length} inspecciones...`);
  const inspectionsToSync = Array.from(pending);

  for (const inspection of inspectionsToSync) {
    try {
      // 1. OBTENER EL ID REAL DE LA CASA (BACKEND ID)
      // =======================================================
      let realHouseId = inspection.house_id;

      try {
        // Intentamos buscar la casa en Realm para sacar su backend_id
        // Asumiendo que 'House' es tu esquema de casas
        if (typeof inspection.house_id === 'string') {
          // Opción A: Si tu house_id es la Primary Key de la Casa en Realm
          const houseObjectId = new Realm.BSON.ObjectId(inspection.house_id);
          const houseLocal = realm.objectForPrimaryKey<any>(
            'House',
            houseObjectId,
          );

          if (houseLocal && houseLocal.backend_id) {
            realHouseId = String(houseLocal.backend_id);
          } else if (houseLocal && !houseLocal.backend_id) {
            console.warn(
              `⚠️ La casa ${inspection.house_id} no está sincronizada aún. Saltando inspección.`,
            );
            continue; // No podemos subir inspección si la casa no existe en el back
          }
        }
      } catch (e) {
        // Si falla la conversión a ObjectId o búsqueda, usamos el ID tal cual viene
        // (Por si ya venía como string del backend)
        realHouseId = inspection.house_id;
      }
      // =======================================================

      // 2. Manejo de Imágenes (Igual que antes)
      const localMedia = JSON.parse(inspection.media_json || '[]');
      const finalMediaForBackend = [];

      for (const file of localMedia) {
        if (
          file.uri.startsWith('file://') ||
          file.uri.startsWith('content://')
        ) {
          console.log('📤 Subiendo archivo:', file.name);
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
            console.error('Error subiendo media, omitiendo:', err);
          }
        } else {
          finalMediaForBackend.push(file);
        }
      }

      // 3. Preparar Payload Base
      const basePayload = {
        houseId: realHouseId, // <--- USAMOS EL ID CORREGIDO
        idGroupVisit: inspection.idGroupVisit,
        idAgentGroup: inspection.idAgentGroup,
        startTime: inspection.startTime,
        endTime: inspection.endTime,
        latitude: inspection.latitude,
        longitude: inspection.longitude,
        someoneAtHome: inspection.someoneAtHome,
        completed: true,

        numberOfAdults: inspection.numberOfAdults || 0,
        numberOfChildren: inspection.numberOfChildren || 0,
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

      let response;

      // 4. DECISIÓN: ¿COMPLETE o CREATE?
      if (inspection.backend_id) {
        console.log(
          `🚀 Finalizando (COMPLETE) inspección: ${inspection.backend_id}`,
        );
        response = await fetchAxiosToken({
          url: `inspections/complete/${inspection.backend_id}`,
          method: 'post',
          body: basePayload,
          subdomain,
        });
      } else {
        // CASO "NO ONE AT HOME" suele caer aquí si no hubo conexión al inicio
        console.log(`🚀 Creando (OFFLINE-CREATE) inspección...`);
        response = await fetchAxiosToken({
          url: `inspections/sync/offline-create`,
          method: 'post',
          body: basePayload,
          subdomain,
        });
      }

      // 5. Actualizar Estado Local
      if (
        response &&
        (response.statusCode === 201 ||
          response.statusCode === 200 ||
          response.id)
      ) {
        const newBackendId =
          response.payload?.id || response.id || inspection.backend_id;

        realm.write(() => {
          const itemToUpdate = realm.objectForPrimaryKey<Inspection>(
            'Inspection',
            inspection._id,
          );
          if (itemToUpdate) {
            itemToUpdate.sync_status = 'synced';
            itemToUpdate.backend_id = newBackendId;
          }
        });
        console.log('✅ Sincronizado OK');
      } else {
        console.error('❌ Error Backend:', response);
      }
    } catch (error) {
      console.error(`❌ Falló sync de inspección ${inspection._id}:`, error);
    }
  }
}
