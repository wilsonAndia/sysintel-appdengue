import { database } from '../index';
import { Q } from '@nozbe/watermelondb';
import InspectionMedia from '../models/InspectionsMedia'; // Verifica que el nombre del archivo sea correcto (sin la 's' si es singular)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

// =====================================================================
// EL PRE-SYNC: SUBIR IMÁGENES LOCALES A AWS S3
// =====================================================================
export const uploadPendingMedia = async () => {
  const token = await AsyncStorage.getItem('token');

  // Buscamos todas las fotos que sean locales (que empiecen con file:// o content://)
  const pendingMediaCollection =
    database.collections.get<InspectionMedia>('inspection_media');
  const pendingFiles = await pendingMediaCollection
    .query(
      Q.or(
        Q.where('url', Q.like('file://%')),
        Q.where('url', Q.like('content://%')),
      ),
    )
    .fetch();

  if (pendingFiles.length === 0) {
    console.log('No hay fotos pendientes por subir a AWS.');
    return;
  }

  console.log(`Subiendo ${pendingFiles.length} archivos a AWS...`);

  // Subimos cada archivo uno por uno
  for (const media of pendingFiles) {
    try {
      const formData = new FormData();

      formData.append('inspection', {
        uri: media.url,
        type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
        name: `offline_upload_${Date.now()}.${media.type === 'image' ? 'jpg' : 'mp4'
          }`,
      } as any);

      // LLAMAMOS AL ENDPOINT QUE CREASTE EN NESTJS
      const response = await fetch(`${API_URL}sync/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // Fetch maneja el Content-Type multipart/form-data automáticamente
        },
        body: formData,
      });
      console.log("response de subida: ", response)
      if (response.ok) {
        const data = await response.json();
        const awsFileName = data.fileName; // NestJS nos devuelve el nombre guardado en S3

        // Actualizamos WatermelonDB: cambiamos "file://..." por el nombre real de S3
        await database.write(async () => {
          await media.update(m => {
            m.url = awsFileName;
          });
        });
        console.log(`✅ Foto subida con éxito: ${awsFileName}`);
      } else {
        console.error(
          `❌ Error del servidor al subir foto: ${response.status}`,
        );
      }
    } catch (error) {
      console.error(`❌ Error de red subiendo foto:`, error, media.url);
    }
  }
};
