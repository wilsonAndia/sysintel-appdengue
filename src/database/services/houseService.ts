import Realm from 'realm';
import { getRealm } from '../index';

export async function saveHouseLocal(data: any) {
  const realm = await getRealm();

  realm.write(() => {
    realm.create('House', {
      _id: new Realm.BSON.ObjectId(),
      backend_id: data.backend_id || null,
      neighborhood: data.neighborhood,
      sector_id: data.sector_id,
      street: data.street,
      number: data.number,
      complement: data.complement,
      latitude: data.latitude,
      longitude: data.longitude,
      responsible: data.responsible,
      subdomain_name: data.subdomain,
      sync_status: data.backend_id ? 'synced' : 'pending',
      updated_at: new Date(),
      deleted_at: null,
    });
  });

  console.log('💾 Casa guardada localmente (offline).');
}

export async function getLocalHouses(sectorId: string) {
  const realm = await getRealm();
  const houses = realm
    .objects('House')
    .filtered('deleted_at = null AND sector_id = $0', sectorId);

  console.log('📦 Casas en cache para esta zona:', houses.length);

  return houses.map(h => ({
    id: (h._id as Realm.BSON.ObjectId).toString(),
    backend_id: h.backend_id || null,
    neighborhood: h.neighborhood,
    street: h.street,
    number: h.number,
    complement: h.complement,
    latitude: h.latitude,
    longitude: h.longitude,
    responsible: h.responsible,
    offline: !h.backend_id,
  }));
}

export async function getPendingHouses(sectorId: string) {
  const realm = await getRealm();

  const houses = realm
    .objects('House')
    .filtered('sync_status = "pending" AND sector_id = $0', sectorId);

  console.log('⏳ Casas pendientes:', houses.length);

  return houses.map(h => ({
    id: (h._id as Realm.BSON.ObjectId).toString(),
    neighborhood: h.neighborhood,
    street: h.street,
    number: h.number,
    complement: h.complement,
    latitude: h.latitude,
    longitude: h.longitude,
    responsible: h.responsible,
  }));
}
