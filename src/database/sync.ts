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
      const rawCreated = data.changes.houses.created || [];
      const rawUpdated = data.changes.houses.updated || [];
      const rawDeleted = data.changes.houses.deleted || [];
      []
      let safeCreated = [];
      let safeUpdated = [];
      let safeDeleted = [];

      // ESCUDO: Si es la primera vez, TODO es "created". Evitamos el error 7-1-1.
      if (isFirstSync) {
        safeCreated = [...rawCreated, ...rawUpdated].map(mapHouse);
        safeUpdated = [];
        safeDeleted = [];
      } else {
        safeCreated = rawCreated.map(mapHouse);
        safeUpdated = rawUpdated.map(mapHouse);
        safeDeleted = rawDeleted;
      }

      console.log(
        `✅ PULL Listo. C: ${safeCreated.length}, U: ${safeUpdated.length}, D: ${safeDeleted.length}`,
      );

      const newTimestamp = Number(data.timestamp) || new Date().getTime();
      await AsyncStorage.setItem(`sync_${sectorId}`, newTimestamp.toString());

      return {
        changes: {
          ...data.changes, // Pasar también las inspecciones y otras tablas
          houses: {
            created: safeCreated,
            updated: safeUpdated,
            deleted: safeDeleted,
          },
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
