import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { fetchAxiosToken } from '../helpers/fetchAxiosToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function syncDataWithNestJS(
  subdomainName: string,
  sectorId: string,
  lat: number,
  lng: number,
) {
  await synchronize({
    database,

    // ==========================================
    // 1. PULL (Descargar del servidor)
    // ==========================================
    pullChanges: async ({ lastPulledAt }) => {
      // Usar AsyncStorage para llevar un lastPulledAt POR SECTOR
      const storedTimestamp = await AsyncStorage.getItem(`sync_${sectorId}`);
      const sectorLastPulledAt = storedTimestamp ? Number(storedTimestamp) : 0;

      console.log(
        `⬇️ Iniciando PULL... (Último sync de este sector: ${sectorLastPulledAt || 'NUNCA'})`,
      );

      const response = await fetchAxiosToken({
        url: 'sync/pull',
        method: 'post',
        body: { lastPulledAt: sectorLastPulledAt, subdomainName, sectorId, lat, lng },
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

      const isFirstSync = !sectorLastPulledAt;

      // ESCUDO: Si es la primera vez, TODO es "created". Evitamos el error 7-1-1.
      const processTable = (tableData: any, mapFn: (item: any) => any = (i) => i) => {
        if (!tableData) return { created: [], updated: [], deleted: [] };
        const rawCreated = tableData.created || [];
        const rawUpdated = tableData.updated || [];
        const rawDeleted = tableData.deleted || [];

        if (isFirstSync) {
          return {
            created: [...rawCreated, ...rawUpdated].map(mapFn),
            updated: [],
            deleted: [],
          };
        } else {
          return {
            created: rawCreated.map(mapFn),
            updated: rawUpdated.map(mapFn),
            deleted: rawDeleted,
          };
        }
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

      const safeHouses = processTable(data.changes.houses, mapHouse);
      const safeInspections = processTable(data.changes.inspections, mapInspection);
      const safePets = processTable(data.changes.inspection_pets);
      const safePools = processTable(data.changes.inspection_pool_conditions);
      const safeBldgChars = processTable(data.changes.inspection_building_characteristics);
      const safeMedia = processTable(data.changes.inspection_media, mapMedia);

      console.log(
        `✅ PULL Listo. Houses C: ${safeHouses.created.length}, U: ${safeHouses.updated.length}, D: ${safeHouses.deleted.length}`,
      );

      const newTimestamp = Number(data.timestamp) || new Date().getTime();
      await AsyncStorage.setItem(`sync_${sectorId}`, newTimestamp.toString());

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
