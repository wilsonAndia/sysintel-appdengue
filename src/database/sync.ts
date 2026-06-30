import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { fetchAxiosToken } from '../helpers/fetchAxiosToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FULL_SECTOR_SYNC_VERSION = 'full-sector-cache-v1';

export async function syncDataWithNestJS(
  subdomainName: string,
  sectorId: string,
  lat?: number | null,
  lng?: number | null,
) {
  await synchronize({
    database,

    // ==========================================
    // 1. PULL (Descargar del servidor)
    // ==========================================
    pullChanges: async () => {
      // Usar AsyncStorage para llevar un lastPulledAt POR SECTOR
      const storedTimestamp = await AsyncStorage.getItem(`sync_${sectorId}`);
      const syncVersionKey = `sync_version_${sectorId}`;
      const storedSyncVersion = await AsyncStorage.getItem(syncVersionKey);
      const shouldReconcileFullSector =
        storedSyncVersion !== FULL_SECTOR_SYNC_VERSION;
      const sectorLastPulledAt =
        storedTimestamp && !shouldReconcileFullSector
          ? Number(storedTimestamp)
          : 0;

      console.log(
        `⬇️ Iniciando PULL... (Último sync de este sector: ${sectorLastPulledAt || 'NUNCA'})`,
      );

      const pullBody: any = {
        lastPulledAt: sectorLastPulledAt,
        subdomainName,
        sectorId,
      };

      if (
        lat !== undefined &&
        lat !== null &&
        lng !== undefined &&
        lng !== null
      ) {
        pullBody.lat = lat;
        pullBody.lng = lng;
      }

      const response = await fetchAxiosToken({
        url: 'sync/pull',
        method: 'post',
        body: pullBody,
        subdomain: subdomainName,
      });

      const data = response.payload ? response.payload : response;

      if (!data || !data.changes) {
        throw new Error('No se recibieron cambios válidos del servidor');
      }

      // Función traductora de formatos
      const mapHouse = (h: any) => ({
        id: h.id,
        neighborhood: h.neighborhood,
        street: h.street,
        number: h.number,
        complement: h.complement || '',
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        responsible: h.responsible,
        owner: h.owner || false,
        subdomain: subdomainName || '',
        sector_id: sectorId || '',
        created_at: h.createdAt
          ? new Date(h.createdAt).getTime()
          : new Date().getTime(),
        updated_at: h.updatedAt
          ? new Date(h.updatedAt).getTime()
          : new Date().getTime(),
      });

      const findExistingIds = async (tableName: string, ids: string[]) => {
        if (ids.length === 0) return new Set<string>();

        const existingIds = new Set<string>();
        const chunkSize = 500;

        for (let index = 0; index < ids.length; index += chunkSize) {
          const idsChunk = ids.slice(index, index + chunkSize);
          const records = await database.collections
            .get(tableName as any)
            .query(Q.where('id', Q.oneOf(idsChunk)))
            .fetch();

          records.forEach(record => existingIds.add(record.id));
        }

        return existingIds;
      };

      const processTable = async (
        tableName: string,
        tableData: any,
        mapFn: (item: any) => any = i => i,
      ) => {
        if (!tableData) return { created: [], updated: [], deleted: [] };
        const rawCreated = tableData.created || [];
        const rawUpdated = tableData.updated || [];
        const rawDeleted = tableData.deleted || [];

        if (shouldReconcileFullSector) {
          const mappedUpserts = [...rawCreated, ...rawUpdated].map(mapFn);
          const existingIds = await findExistingIds(
            tableName,
            mappedUpserts.map((item: any) => item.id),
          );

          return {
            created: mappedUpserts.filter(
              (item: any) => !existingIds.has(item.id),
            ),
            updated: mappedUpserts.filter((item: any) =>
              existingIds.has(item.id),
            ),
            deleted: rawDeleted,
          };
        }

        return {
          created: rawCreated.map(mapFn),
          updated: rawUpdated.map(mapFn),
          deleted: rawDeleted,
        };
      };

      const mapInspection = (i: any) => ({
        ...i,
        latitude: i.latitude != null ? Number(i.latitude) : null,
        longitude: i.longitude != null ? Number(i.longitude) : null,
      });

      const mapMedia = (m: any) => ({
        ...m,
        latitude: m.latitude != null ? Number(m.latitude) : null,
        longitude: m.longitude != null ? Number(m.longitude) : null,
      });

      const safeHouses = await processTable(
        'houses',
        data.changes.houses,
        mapHouse,
      );
      const safeInspections = await processTable(
        'inspections',
        data.changes.inspections,
        mapInspection,
      );
      const safePets = await processTable(
        'inspection_pets',
        data.changes.inspection_pets,
      );
      const safePools = await processTable(
        'inspection_pool_conditions',
        data.changes.inspection_pool_conditions,
      );
      const safeBldgChars = await processTable(
        'inspection_building_characteristics',
        data.changes.inspection_building_characteristics,
      );
      const safeMedia = await processTable(
        'inspection_media',
        data.changes.inspection_media,
        mapMedia,
      );

      console.log(
        `✅ PULL Listo. Houses C: ${safeHouses.created.length}, U: ${safeHouses.updated.length}, D: ${safeHouses.deleted.length}`,
      );

      const newTimestamp = Number(data.timestamp) || new Date().getTime();
      await AsyncStorage.setItem(`sync_${sectorId}`, newTimestamp.toString());
      await AsyncStorage.setItem(syncVersionKey, FULL_SECTOR_SYNC_VERSION);

      return {
        changes: {
          ...data.changes, // Pasar también otras tablas si existen
          houses: safeHouses,
          inspections: safeInspections,
          inspection_pets: safePets,
          inspection_pool_conditions: safePools,
          inspection_building_characteristics: safeBldgChars,
          inspection_media: safeMedia,
        },
        timestamp: newTimestamp,
      };
    },

    // ==========================================
    // 2. PUSH (Subir al servidor)
    // ==========================================
    pushChanges: async ({ changes }) => {
      console.log('⬆️ Iniciando PUSH...', changes);

      const response = await fetchAxiosToken({
        url: 'sync/push',
        method: 'post',
        body: { changes, subdomainName },
        subdomain: subdomainName,
      });

      if (
        response.statusCode !== 200 &&
        response.statusCode !== 201 &&
        !response.success
      ) {
        throw new Error(`Error en PUSH. Status: ${response.statusCode}`);
      }

      console.log('✅ PUSH Exitoso.');
    },
  });
}
