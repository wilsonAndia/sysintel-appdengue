import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Modal,
  BackHandler,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../../helpers/types/navigationProp';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSelectedZone, Zone } from '../../../redux/zonesSlice';

import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { hasInternet } from '../../../helpers/checkConnection';
import { setToken, setUser } from '../../../redux/authSlice';
import { ApiResponse } from '../../../../App';
import { syncDataWithNestJS } from '../../../database/sync';
// === IMPORTACIONES DE WATERMELONDB ===
import withObservables from '@nozbe/with-observables';
import House from '../../../database/models/House';
import { observeHousesBySector } from '../../../database/services/houseService';
import { uploadPendingMedia } from '../../../database/services/syncManager';

// ============================================================================
// PERMISOS ORIGINALES
// ============================================================================
export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permissão de Localização',
        message: 'Precisamos da sua localização para continuar',
        buttonNeutral: 'Perguntar depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return result === RESULTS.GRANTED;
  }
};

export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permissão da Câmera',
        message: 'Precisamos da sua câmera para tirar fotos e vídeos.',
        buttonNeutral: 'Perguntar depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const result = await request(PERMISSIONS.IOS.CAMERA);
    return result === RESULTS.GRANTED;
  }
};

// ============================================================================
// 1. COMPONENTE REACTIVO INDIVIDUAL (Observa UNA sola casa)
// ============================================================================
const HouseItem = ({
  house,
  navigation,
}: {
  house: House;
  navigation: any;
}) => {
  // Ahora, como observamos la casa directamente, si su estado cambia,
  // ESTE componente se vuelve a pintar solito al instante.
  const isOffline = house._raw._status !== 'synced';

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('HouseInspections', { id: house.id })}
    >
      <View style={tw`p-4 mb-4 rounded-lg shadow-md bg-blue-sysintel-50`}>
        <View style={tw`flex-row items-center mb-1`}>
          {isOffline && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: 'red',
                marginRight: 10,
              }}
            />
          )}
          <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
            {house.street}, {house.number} - {house.neighborhood}
          </Text>
        </View>
        <Text style={tw`text-blue-sysintel-800`}>
          Complemento: {house.complement || ''}
        </Text>
        <Text style={tw`text-blue-sysintel-800`}>
          Responsável: {house.responsible}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Envolvemos el HouseItem individual en withObservables
const ReactiveHouseItem = withObservables(
  ['house'],
  ({ house }: { house: House }) => ({
    house: house.observe(), // Observamos sus cambios internos (como el _status)
  }),
)(HouseItem);

// ============================================================================
// 2. COMPONENTE DE LISTA REACTIVA (Observa EL TOTAL de casas)
// ============================================================================
const HouseList = ({
  houses,
  navigation,
}: {
  houses: House[];
  navigation: any;
}) => {
  if (houses.length === 0) {
    return (
      <View style={tw`items-center justify-start px-4 mt-8`}>
        <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
          Nenhuma casa encontrada neste setor.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={tw`h-full p-2 rounded-lg`}
      data={houses}
      keyExtractor={house => house.id}
      contentContainerStyle={tw`px-4 py-4 flex-grow`}
      // ¡Aquí usamos nuestro nuevo componente individual reactivo!
      renderItem={({ item }) => (
        <ReactiveHouseItem house={item} navigation={navigation} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

const ReactiveHouseList = withObservables(
  ['sectorId'],
  ({ sectorId }: { sectorId: string }) => ({
    houses: observeHousesBySector(sectorId),
  }),
)(HouseList);

// ============================================================================
// PANTALLA PRINCIPAL
// ============================================================================
const HouseInspection = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const zone = useSelector((state: RootState) => state.zones.selectedZone);
  const inTheArea = useSelector(
    (state: RootState) => state.inTheArea.inTheArea,
  );
  const userRedux = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isZoneModalVisible, setZoneModalVisible] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          dispatch(setToken(token));
          const response: ApiResponse = await fetchAxiosToken({
            url: `users/getOne/token`,
            method: 'post',
          });
          dispatch(
            setUser({
              id: response.payload.id,
              firstName: response.payload.firstName,
              lastName: response.payload.lastName,
              email: response.payload.email,
              phone: response.payload.phone,
              avatar: response.payload.avatar,
              first_login: response.payload.first_login,
              subdomain: response.payload.subdomain,
            }),
          );
        }
      } catch (error) {
        console.error('Error al cargar el token:', error);
      }
    };
    loadToken();
  }, [dispatch]);

  const checkAndGetPermissions = async () => {
    const hasLocation = await requestLocationPermission();
    const hasCamera = await requestCameraPermission();

    if (!hasLocation) {
      Alert.alert(
        'Permissão Negada',
        'Não podemos continuar sem a localização.',
      );
      return;
    }
    if (!hasCamera) {
      Alert.alert('Permissão Negada', 'Não podemos continuar sem a câmera.');
      return;
    }
    await getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        Alert.alert('Erro', 'Não foi possível obter a localização atual.');
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 },
    );
  };

  const fetchZones = async () => {
    const connected = await hasInternet();
    if (!connected) return;
    try {
      const response = await fetchAxiosToken({
        url: `region/get/regions-by-user`,
        method: 'get',
      });
      setZones(response.payload);
    } catch (error) {
      console.log('Erro ao buscar zonas:', error);
    }
  };

  const formatDate = (s?: string | null) => {
    if (!s) return '';
    try {
      const dateOnly = s.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      if (!year || !month || !day) return s;
      return `${day}/${month}/${year}`;
    } catch (e) {
      return s;
    }
  };

  const handleZoneChange = async (zoneH: Zone) => {
    dispatch(
      setSelectedZone({
        ...zoneH,
        inTheArea: (zone && zone.inTheArea) || false,
      }),
    );
    try {
      await AsyncStorage.setItem('selectedZone', JSON.stringify(zoneH));
    } catch (error) {
      console.log('Error al guardar la zona:', error);
    }
  };

  useEffect(() => {
    fetchZones();
    checkAndGetPermissions();

    const loadSelectedZone = async () => {
      try {
        const storedZone = await AsyncStorage.getItem('selectedZone');
        if (storedZone) {
          const parsedZone: Zone = JSON.parse(storedZone);
          dispatch(
            setSelectedZone({
              ...parsedZone,
              inTheArea: (zone && zone.inTheArea) || false,
            }),
          );
        } else {
          setZoneModalVisible(true);
        }
      } catch (error) {
        console.log('Error al cargar la zona almacenada:', error);
      } finally {
        setLoading(false); // Quitamos el loading una vez que sabemos la zona
      }
    };

    loadSelectedZone();

    const backAction = () => {
      if (isZoneModalVisible) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [isZoneModalVisible]);

  const syncNow = async () => {
    if (!zone?.sectorId || !location?.latitude || !location?.longitude) {
      Alert.alert(
        'Atenção',
        'Precisamos da sua localização e da zona para sincronizar.',
      );
      return;
    }

    try {
      Alert.alert(
        'Sincronizando...',
        'Subindo fotos e dados. Aguarde um momento.',
      );

      // 1. PASO NUEVO: Subimos las fotos a AWS primero y cambiamos los nombres
      await uploadPendingMedia();

      // 2. PASO VIEJO: Sincronizamos el texto con NestJS (que ahora llevará los nombres correctos de las fotos)
      await syncDataWithNestJS(
        userRedux?.subdomain || '',
        zone.sectorId,
        location.latitude,
        location.longitude,
      );

      Alert.alert('Sucesso!', 'Os dados foram sincronizados com o servidor.');
    } catch (error) {
      console.error('Erro de sincronização:', error);
      Alert.alert(
        'Erro',
        'Houve um problema ao sincronizar os dados. Tente novamente mais tarde.',
      );
    }
  };

  return (
    <SafeAreaView style={tw`w-full h-full bg-white `}>
      <Navbar />
      <View style={tw`px-4 mt-10`}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      <View style={tw`px-4 mt-6 mb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-xl font-bold text-blue-sysintel-900`}>
            Inspeção de Casas
          </Text>
          <View style={tw`flex-row items-center`}>
            {/* === Botón sincronizar === */}
            <TouchableOpacity
              onPress={syncNow}
              style={tw`px-4 py-2 rounded-lg mr-2 bg-green-700`}
            >
              <Text style={tw`text-white font-bold`}>Sync</Text>
            </TouchableOpacity>

            {/* === Botón Criar Casa === */}
            <TouchableOpacity
              style={tw.style(
                'px-4 py-2 rounded-lg',
                inTheArea ? 'bg-blue-sysintel-800' : 'bg-blue-sysintel-200',
              )}
              onPress={() => navigation.navigate('CreateHouse')}
            >
              <Text style={tw`font-bold text-white`}>+ Criar Casa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* === LISTA REACTIVA === */}
      {loading ? (
        <View style={tw`items-center justify-center h-full`}>
          <ActivityIndicator size="large" color="#144c78" />
          <Text style={tw`mt-2 text-blue-sysintel-900`}>
            Carregando banco local...
          </Text>
        </View>
      ) : zone?.sectorId ? (
        <ReactiveHouseList sectorId={zone.sectorId} navigation={navigation} />
      ) : (
        <View style={tw`items-center justify-center mt-8`}>
          <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
            Selecione uma zona primeiro.
          </Text>
        </View>
      )}

      {/* === MODAL DE ZONAS === */}
      <Modal
        visible={isZoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => navigation.goBack()}
      >
        <View
          style={tw`items-center justify-center flex-1 bg-black bg-opacity-50`}
        >
          <View style={tw`bg-white w-4/5 rounded-lg p-4 max-h-[70%]`}>
            <Text style={tw`mb-4 text-lg font-bold`}>Selecionar Zona</Text>
            <FlatList
              data={zones}
              keyExtractor={item => item.visitId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={tw`py-2 border-b border-gray-300`}
                  onPress={() => {
                    handleZoneChange(item);
                    setZoneModalVisible(false);
                  }}
                >
                  <Text style={tw`text-base text-gray-700`}>
                    {item.sectorGroup} - {item.groupName} (
                    <Text style={tw`text-[9px] text-gray-700`}>
                      {formatDate(item.startDate)}
                    </Text>
                    {' - '}
                    <Text style={tw`text-[9px] text-gray-700`}>
                      {formatDate(item.endDate)}
                    </Text>
                    )
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HouseInspection;
