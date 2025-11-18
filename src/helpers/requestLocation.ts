import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import { Platform } from 'react-native';

export async function requestLocationPermission(): Promise<
  'granted' | 'denied' | 'blocked'
> {
  const permission =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

  // Verificar permiso actual
  const status = await check(permission);
  console.log('Permiso actual:', status);

  if (status === RESULTS.GRANTED) return 'granted';
  if (status === RESULTS.BLOCKED) return 'blocked';

  // Si no está bloqueado, pedirlo
  const result = await request(permission);
  console.log('Resultado al pedir:', result);

  if (result === RESULTS.GRANTED) return 'granted';
  if (result === RESULTS.BLOCKED) return 'blocked';

  return 'denied';
}

export function openAppSettings() {
  openSettings().catch(() => console.log('No se pudo abrir configuraciones'));
}
