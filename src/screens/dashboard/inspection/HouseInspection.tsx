import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Modal,
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
import { setInTheArea } from '../../../redux/inTheAreaSlice';
import { PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { getLocalHouses } from '../../../database/services/houseService';
import { hasInternet } from '../../../helpers/checkConnection';

interface House {
  id: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | null;
  latitude: number;
  longitude: number;
  responsible: string;

  // campos opcionales que SOLO vienen del back
  subdomain_name?: string;
  sync_status?: string;
  updated_at?: string;
  deleted_at?: string | null;

  // marca de casas guardadas localmente
  offline?: boolean;
}

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

const HouseInspection = () => {
  const navigation = useNavigation<NavigationProp>();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const zone = useSelector((state: RootState) => state.zones.selectedZone);
  const inTheArea = useSelector(
    (state: RootState) => state.inTheArea.inTheArea,
  );
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isZoneModalVisible, setZoneModalVisible] = useState(false);

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
        await fetchHouses(position.coords.latitude, position.coords.longitude);
      },
      error => {
        Alert.alert('Erro', 'Não foi possível obter a localização atual.');
        console.log('Error:', error);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 },
    );
  };

  // const fetchHouses = async (latitude: number, longitude: number) => {
  //   console.log('userReduc', userRedux);
  //   try {
  //     const response = await fetchAxiosToken({
  //       url: `inspections/houses/coordinates`,
  //       method: 'post',
  //       body: {
  //         latitude: Number(latitude),
  //         longitude: Number(longitude),

  //         sectorId: zone?.sectorId || '',
  //       },
  //       subdomain: userRedux?.subdomain,
  //     });

  //     if (response.statusCode === 200) {
  //       setHouses(response.payload.houses);
  //       if (zone) {
  //         console.log('inTheArea:', response.payload.inTheArea);
  //         dispatch(
  //           setInTheArea({
  //             inTheArea: response.payload.inTheArea || false,
  //           }),
  //         );
  //       }
  //     } else {
  //       console.log('Error al obtener casas:', response.message);
  //     }
  //   } catch (error) {
  //     console.log('Error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchHouses = async (latitude: number, longitude: number) => {
    console.log('userReduc', userRedux);

    const connected = await hasInternet();

    if (!connected) {
      console.log('📡 Sin internet → cargar casas del cache...');
      console.log('zone', zone?.sectorId);
      const localHouses = await getLocalHouses(zone?.sectorId ?? '');
      const normalizedHouses: House[] = (localHouses as any[]).map(h => ({
        id: String(h.id),
        neighborhood: String(h.neighborhood ?? ''),
        street: String(h.street ?? ''),
        number: String(h.number ?? ''),
        complement: h.complement ?? null,
        latitude: Number(h.latitude) || 0,
        longitude: Number(h.longitude) || 0,
        responsible: String(h.responsible ?? ''),
        offline: true,
      }));
      setHouses(normalizedHouses);
      setLoading(false);
      return;
    }

    try {
      const response = await fetchAxiosToken({
        url: `inspections/houses/coordinates`,
        method: 'post',
        body: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          sectorId: zone?.sectorId || '',
        },
        subdomain: userRedux?.subdomain,
      });

      if (response.statusCode === 200) {
        setHouses(response.payload.houses);

        if (zone) {
          dispatch(
            setInTheArea({
              inTheArea: response.payload.inTheArea || false,
            }),
          );
        }
      } else {
        console.log('Error al obtener casas:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    const connected = await hasInternet();
    if (!connected) {
      console.log('Sem conexão, não é possível buscar zonas');
      return;
    }

    try {
      const response = await fetchAxiosToken({
        url: `region/get/regions-by-user`,
        method: 'get',
      });

      setZones(response.payload);
    } catch (error) {
      console.log('Erro:', error);
      Alert.alert('Erro', 'Houve um problema ao obter zonas');
    }
  };

  const handleZoneChange = async (zoneH: Zone) => {
    dispatch(
      setSelectedZone({
        regionName: zoneH.regionName,
        groupName: zoneH.groupName,
        visitId: zoneH.visitId,
        sectorGroup: zoneH.sectorGroup,
        sectorId: zoneH.sectorId,
        inTheArea: (zone && zone.inTheArea) || false,
      }),
    );
    fetchHouses(location?.latitude || 0, location?.longitude || 0);

    try {
      await AsyncStorage.setItem('selectedZone', JSON.stringify(zone));
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
              regionName: parsedZone.regionName,
              groupName: parsedZone.groupName,
              visitId: parsedZone.visitId,
              sectorGroup: parsedZone.sectorGroup,
              sectorId: parsedZone.sectorId,
              inTheArea: (zone && zone.inTheArea) || false,
            }),
          );
        } else {
          setZoneModalVisible(true);
        }
      } catch (error) {
        console.log('Error al cargar la zona almacenada:', error);
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getCurrentLocation();
    } finally {
      setRefreshing(false);
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
          <TouchableOpacity
            style={tw.style(
              'px-4 py-2 rounded-lg',
              inTheArea ? 'bg-blue-sysintel-800' : 'bg-blue-sysintel-200',
            )}
            onPress={() => {
              // if (!inTheArea) {
              //   Alert.alert(
              //     'Atenção',
              //     'Você deve estar dentro da zona para criar uma casa.',
              //   );
              //   return;
              // }
              navigation.navigate('CreateHouse');
            }}
          >
            <Text style={tw`font-bold text-white`}>+ Criar Casa</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={tw`items-center justify-center h-full`}>
          <ActivityIndicator size="large" color="#144c78" />
          <Text style={tw`mt-2 text-blue-sysintel-100`}>
            Carregando casas...
          </Text>
        </View>
      ) : houses.length === 0 ? (
        <View style={tw`items-center justify-start px-4 mt-8`}>
          <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
            Nenhuma casa encontrada na sua localização.
          </Text>
        </View>
      ) : (
        <FlatList
          style={tw`h-full p-2 rounded-lg `}
          data={houses}
          keyExtractor={house => house.id}
          contentContainerStyle={tw`px-4 py-4 flex-grow`}
          renderItem={({ item: house }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('HouseInspections', { id: house.id })
              }
            >
              <View
                style={tw`p-4 mb-4 rounded-lg shadow-md bg-blue-sysintel-50`}
              >
                {/* Punto rojo si es offline */}
                {house.offline && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'red',
                      marginRight: 10,
                      marginTop: 6,
                    }}
                  />
                )}
                <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
                  {house.street}, {house.number} - {house.neighborhood}
                </Text>
                <Text style={tw`text-blue-sysintel-800`}>
                  Complemento: {house.complement || ''}
                </Text>
                <Text style={tw`text-blue-sysintel-800`}>
                  Responsável: {house.responsible}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          // Si no hay datos, muestra el vacío (y sigue habilitado el pull)
          ListEmptyComponent={
            <View style={tw`items-center justify-start mt-8`}>
              <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
                Nenhuma casa encontrada na sua localização.
              </Text>
            </View>
          }
          // (Android) baja un poco el spinner para que no tape el header
          progressViewOffset={20}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Modal
        visible={isZoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          navigation.goBack();
        }}
      >
        <View
          style={tw`items-center justify-center flex-1 bg-black bg-opacity-50`}
        >
          <View style={tw`bg-white w-4/5 rounded-lg p-4 max-h-[70%]`}>
            <Text style={tw`mb-4 text-lg font-bold`}>Seleccionar Zona</Text>
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
                    {item.sectorGroup}
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
