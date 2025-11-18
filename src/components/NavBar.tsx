import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Line, Path, Svg } from 'react-native-svg';
import tw from '../../tailwind';
import { NavigationProp } from '../helpers/types/navigationProp';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { clearToken } from '../redux/authSlice';
import { RootState } from '../redux/store';
import { clearSelectedZone, setSelectedZone, Zone } from '../redux/zonesSlice';
import { fetchAxiosToken } from '../helpers/fetchAxiosToken';

import { ScrollView } from 'react-native-gesture-handler';

import Geolocation from '@react-native-community/geolocation';

import { Linking, Platform } from 'react-native';

import { API_URL } from '@env';
import {
  openAppSettings,
  requestLocationPermission,
} from '../helpers/requestLocation';

type GeoPosition = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    heading: number | null;
    speed: number;
  };
  timestamp: number;
};
let MENU = [
  {
    id: 1,
    title: 'HouseInspection',
    url: 'HouseInspection',

    icon: (
      <Svg
        style={tw`h-7 w-7 text-blue-sysintel-100`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 21h18M3 10h18M3 14h18M3 6h18"
        />
      </Svg>
    ),
  },
  {
    id: 2,
    title: 'Suporte',
    url: 'SupportTickets',
    icon: (
      <Svg
        style={tw`h-7 w-7 text-blue-sysintel-100`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </Svg>
    ),
  },
];

const Navbar: React.FC = () => {
  const { width, height } = useWindowDimensions(); // Para saber el ancho de la pantalla
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0]; // Posición inicial fuera de la pantalla
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const selectedZoneRedux = useSelector(
    (state: RootState) => state.zones.selectedZone,
  );
  const [showOptions, setShowOptions] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZoneState] = useState<Zone | null>(null);
  const [isZoneModalVisible, setZoneModalVisible] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [loddingGPS, setLoddingGPS] = useState(false);

  const checkIfLocationIsEnabled = async (): Promise<boolean> => {
    console.log('Entrando a checkIfLocationIsEnabled...');

    const result = await requestLocationPermission();

    if (result === 'blocked') {
      console.log('PERMISO BLOQUEADO — ir a ajustes');

      setShowGpsModal(true); // Abres el modal para enviar al usuario a Configuración
      return false;
    }

    if (result === 'denied') {
      console.log('PERMISO NEGADO — intentar otra vez');
      return false;
    }

    // granted
    try {
      const position = await new Promise<GeoPosition | null>(resolve => {
        Geolocation.getCurrentPosition(
          pos => {
            console.log('Ubicación obtenida:', pos.coords);
            resolve(pos as GeoPosition);
          },
          error => {
            console.log('Error obteniendo ubicación:', error);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      });

      return position !== null;
    } catch (err) {
      console.log('Unexpected error:', err);
      return false;
    }
  };

  // const checkIfLocationIsEnabled = async (): Promise<boolean> => {
  //   console.log('Entrando a checkIfLocationIsEnabled...');

  //   const hasPermission = await requestLocationPermission();
  //   if (!hasPermission) {
  //     console.log('No tiene permiso de ubicación');
  //     return false;
  //   }
  //   console.log(hasPermission);
  //   try {
  //     const position = await new Promise<GeoPosition | null>(resolve => {
  //       Geolocation.getCurrentPosition(
  //         pos => {
  //           console.log('Ubicación obtenida:', pos.coords);
  //           resolve(pos as GeoPosition);
  //         },
  //         error => {
  //           console.log('este es el error', error);
  //           if (error.code === 1) {
  //             console.log(
  //               'PERMISSION_DENIED: No se dieron permisos de ubicación',
  //             );
  //           } else if (error.code === 2) {
  //             console.log(
  //               'POSITION_UNAVAILABLE: El GPS está desactivado o sin señal',
  //             );
  //           } else if (error.code === 3) {
  //             console.log('TIMEOUT: No se pudo obtener ubicación a tiempo');
  //           }

  //           resolve(null); // nunca lances, siempre resuelve
  //         },
  //         {
  //           enableHighAccuracy: false,
  //           timeout: 20000, // 10 segundos
  //           maximumAge: 1000,
  //         },
  //       );
  //     });

  //     return position !== null;
  //   } catch (e) {
  //     console.log('Unexpected error in checkIfLocationIsEnabled:', e);
  //     return false;
  //   }
  // };

  const interval = async () => {
    try {
      const isEnabled = await checkIfLocationIsEnabled();
      setGpsEnabled(isEnabled);
      setShowGpsModal(!isEnabled);
    } catch (err) {
      console.log('Error checking GPS status:', err);
    }
  };
  useEffect(() => {
    interval();
  }, []);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const toggleNavbar = async () => {
    if (isOpen) {
      // Ocultar el navbar
      Animated.timing(slideAnim, {
        toValue: -width, // Mover fuera de la pantalla
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    } else {
      setIsOpen(true);
      // Mostrar el navbar
      Animated.timing(slideAnim, {
        toValue: 0, // Posición de inicio
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'selectedZone']);
      dispatch(clearToken());
      dispatch(clearSelectedZone());

      navigation.navigate('Login'); // Redirige a la pantalla de login
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
      // Opcional: Mostrar una notificación en caso de error
    }
  };

  const fetchZones = async () => {
    try {
      const response = await fetchAxiosToken({
        url: `region/get/regions-by-user`,
        method: 'get',
      });
      console.log('Zonas:', response.payload);
      setZones(response.payload);
    } catch (error) {
      console.log('Erro Zonass:', error);
      Alert.alert('Erro', 'Houve um problema ao obter zonas');
    }
  };

  useEffect(() => {
    const loadSelectedZone = async () => {
      try {
        const storedZone = await AsyncStorage.getItem('selectedZone');

        if (storedZone) {
          const parsedZone: Zone = JSON.parse(storedZone);
          setSelectedZoneState(parsedZone);
          dispatch(setSelectedZone(parsedZone));
        }
      } catch (error) {
        console.log('Error al cargar la zona almacenada:', error);
      }
    };

    loadSelectedZone();

    if (zones.length === 0) {
      fetchZones();
    }
  }, []);

  const handleNavigate = (title: any) => {
    setIsOpen(false);

    navigation.navigate(title);
  };

  const handleZoneChange = async (zone: Zone) => {
    setSelectedZoneState(zone);
    dispatch(setSelectedZone(zone));
    try {
      await AsyncStorage.setItem('selectedZone', JSON.stringify(zone));
    } catch (error) {
      console.log('Error al guardar la zona:', error);
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openURL(
        'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end',
      );
    } else {
      Linking.openURL('App-Prefs:root');
    }
  };

  const recheckGps = async () => {
    setLoddingGPS(true);
    const enabled = await checkIfLocationIsEnabled();
    setLoddingGPS(false);
    if (enabled) {
      setGpsEnabled(true);
      setShowGpsModal(false);
    } else {
      Alert.alert(
        'GPS ainda não ativo',
        'Por favor, ative o GPS para continuar.',
      );
    }
  };

  return (
    <SafeAreaView style={tw`z-50 w-full`}>
      {/* Header del Navbar */}
      {!isOpen && (
        <View
          style={tw`flex-row items-center justify-between h-16 p-4 bg-blue-sysintel-900 `}
        >
          <TouchableOpacity onPress={toggleNavbar}>
            <Svg
              style={tw`text-white h-7 w-7 `}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Line x1="3" y1="12" x2="21" y2="12" />
              <Line x1="3" y1="6" x2="21" y2="6" />
              <Line x1="3" y1="18" x2="21" y2="18" />
            </Svg>
          </TouchableOpacity>

          <View style={tw`p-1 px-2 rounded-md bg-blue-sysintel-300`}>
            <View style={tw`flex-row items-center justify-center gap-4`}>
              <View style={[tw`flex-col items-start justify-center gap-1`]}>
                <Text
                  style={tw`text-xs font-semibold capitalize text-blue-sysintel-900 `}
                >
                  {userRedux?.firstName} {userRedux?.lastName}{' '}
                </Text>
                <TouchableOpacity onPress={() => setZoneModalVisible(true)}>
                  <Text
                    style={tw`text-xs font-semibold capitalize text-blue-sysintel-900`}
                  >
                    Zona:{' '}
                    {selectedZoneRedux?.sectorGroup ||
                      selectedZone?.sectorGroup ||
                      'Selecione a zona'}{' '}
                  </Text>

                  {selectedZoneRedux?.groupName && (
                    <Text style={tw`text-[10px] text-blue-sysintel-900`}>
                      {selectedZoneRedux.groupName}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={tw`w-12 h-12 overflow-hidden rounded-full `}>
                <Image
                  source={{
                    uri: `${API_URL}users/getImage/${userRedux?.avatar}`,
                  }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={isZoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setZoneModalVisible(false)}
      >
        <View
          style={tw`items-center justify-center flex-1 bg-black bg-opacity-50`}
        >
          <View
            style={tw`bg-blue-sysintel-100 w-4/5 rounded-lg p-4 max-h-[70%]`}
          >
            <Text style={tw`mb-4 text-lg font-bold`}>Selecione a zona</Text>
            <ScrollView>
              {zones.map(zone => (
                <TouchableOpacity
                  key={zone.visitId}
                  style={tw`py-2 border-b border-blue-sysintel-300`}
                  onPress={() => {
                    handleZoneChange(zone);
                    setZoneModalVisible(false);
                  }}
                >
                  <Text style={tw`text-base text-blue-sysintel-700`}>
                    {zone.sectorGroup} - {zone.groupName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setZoneModalVisible(false)}
              style={tw`self-end mt-4`}
            >
              <Text style={tw`text-blue-sysintel-500`}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* <Modal visible={showGpsModal} transparent animationType="slide">
        <View
          style={tw`items-center justify-center flex-1 bg-black bg-opacity-60`}
        >
          <View style={tw`w-4/5 p-6 rounded-lg bg-blue-sysintel-100`}>
            <Text
              style={tw`mb-4 text-lg font-bold text-center text-blue-sysintel-900`}
            >
              GPS desativado
            </Text>
            <Text style={tw`mb-6 text-base text-center text-blue-sysintel-700`}>
              Este aplicativo requer que o GPS esteja ativado para funcionar.
              Ative-o para continuar.
            </Text>
        

            <TouchableOpacity
              onPress={recheckGps}
              disabled={loddingGPS}
              style={tw`px-4 py-2 border rounded border-blue-sysintel-500`}
            >
              {loddingGPS ? (
                <Text
                  style={tw`font-semibold text-center text-blue-sysintel-200 `}
                >
                  Verificando GPS...
                </Text>
              ) : (
                <Text
                  style={tw`font-semibold text-center text-blue-sysintel-500`}
                >
                  GPS já ativado
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      <Modal visible={showGpsModal} transparent animationType="fade">
        <View style={tw`items-center justify-center flex-1 bg-black/60`}>
          <View style={tw`bg-white w-4/5 p-6 rounded-xl`}>
            <Text style={tw`text-lg font-bold text-center`}>
              Permiso de ubicación desactivado
            </Text>

            <Text style={tw`mt-3 text-center`}>
              Debes habilitar el permiso de ubicación para continuar.
            </Text>

            <TouchableOpacity
              style={tw`mt-6 bg-blue-500 p-3 rounded`}
              onPress={openAppSettings}
            >
              <Text style={tw`text-center text-white font-semibold`}>
                Abrir configuración
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-3 border border-blue-500 p-3 rounded`}
              onPress={recheckGps}
            >
              <Text style={tw`text-center text-blue-600 font-semibold`}>
                Ya di el permiso
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menu desplegable del Navbar */}
      {isOpen && (
        <Animated.View
          style={[
            tw`absolute top-0 z-50 p-5 bg-blue-sysintel-900`,
            {
              width: width * 0.8,
              height: height, // Asegurarse de que el navbar tenga la altura completa de la pantalla
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Pressable
            style={tw`absolute items-center justify-center w-20 h-20 rounded-full top-10 -right-7 bg-blue-sysintel-900 `}
            onPress={toggleNavbar}
          >
            <Svg
              style={tw`text-blue-sysintel-100 h-7 w-7 `}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </Svg>
          </Pressable>
          <View style={tw`flex-col items-center justify-between w-full h-full`}>
            <View style={tw`w-full`}>
              <View style={tw`flex-row items-center justify-start`}>
                <View
                  style={tw`flex-col items-start justify-center gap-2 ml-5`}
                >
                  <Text style={tw`text-lg text-blue-sysintel-100`}>
                    {userRedux?.firstName}
                    {userRedux?.lastName}
                  </Text>
                  <Text style={tw`text-xs text-blue-sysintel-100`}>
                    {userRedux?.email}
                  </Text>
                </View>
              </View>
              <View style={tw`flex-col items-start justify-center gap-4 mt-4 `}>
                <View style={tw`bg-white h-0.3 w-full `} />
                <TouchableOpacity onPress={toggleOptions}>
                  <View style={tw`flex-row items-center justify-start gap-2 `}>
                    <Svg
                      style={tw`text-white h-7 w-7`}
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <Path stroke="none" d="M0 0h24v24H0z" />
                      <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <Circle cx="12" cy="12" r="3" />
                    </Svg>
                    <Text style={tw`text-base text-blue-sysintel-100`}>
                      Perfil
                    </Text>
                  </View>
                </TouchableOpacity>

                {showOptions && (
                  <View style={tw`ml-7`}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditarPerfil')}
                    >
                      <View
                        style={tw`flex-row items-center justify-start gap-2 `}
                      >
                        <Svg
                          style={tw`w-6 h-6 text-blue-sysintel-100`}
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <Path stroke="none" d="M0 0h24v24H0z" />
                          <Circle cx="12" cy="12" r="9" />
                        </Svg>
                        <Text style={tw`text-sm text-blue-sysintel-100`}>
                          Editar Perfil
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('CambiarPassword')}
                      style={tw`mt-2`}
                    >
                      <View
                        style={tw`flex-row items-center justify-start gap-2 mt-4 `}
                      >
                        <Svg
                          style={tw`w-6 h-6 text-blue-sysintel-100`}
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <Path stroke="none" d="M0 0h24v24H0z" />
                          <Circle cx="12" cy="12" r="9" />
                        </Svg>
                        <Text style={tw`text-sm text-blue-sysintel-100`}>
                          Cambiar contraseña
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={tw`bg-blue-sysintel-100 h-0.3 w-full`} />
              </View>

              <View style={tw`mt-5`}>
                {MENU.map((menu, index) => (
                  <View key={menu.id}>
                    <TouchableOpacity
                      onPress={() => handleNavigate(menu.url)}
                      style={tw`flex-row items-center justify-start gap-2 mt-4 `}
                    >
                      <View
                        style={tw`flex-row items-center justify-start gap-2 mt-4 `}
                      >
                        {menu.icon}
                        <Text style={tw`text-base text-blue-sysintel-100`}>
                          {menu.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index + 1 !== MENU.length && (
                      <View style={tw`bg-white h-0.3 mt-4`} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={tw`flex-col items-start justify-start w-full`}>
              <View style={tw`bg-white h-0.3 mt-4 w-full`} />
              <TouchableOpacity
                onPress={logout}
                style={tw`flex-row items-center justify-start gap-2 mt-4`}
              >
                <Svg
                  style={tw`text-white h-7 w-7`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </Svg>
                <Text style={tw`text-base text-blue-sysintel-100`}>
                  Encerrar sessão
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default Navbar;
