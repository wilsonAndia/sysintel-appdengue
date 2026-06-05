import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  Switch,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../../helpers/types/navigationProp';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import { Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { hasInternet } from '../../../helpers/checkConnection';
import { saveHouseInWatermelonDB } from '../../../database/services/houseService';
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

type LocationAddress = {
  street?: string;
  neighborhood?: string;
};

const getFirstString = (...values: unknown[]) =>
  values.find(value => typeof value === 'string' && value.trim().length > 0) as
    | string
    | undefined;

const CreateHouse = () => {
  const navigation = useNavigation<NavigationProp>();
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [responsible, setResponsible] = useState('');
  const [owner, setOwner] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const zone = useSelector((state: RootState) => state.zones.selectedZone);

  const userRedux = useSelector((state: RootState) => state.auth.user);

  const [isOnline, setIsOnline] = useState(true);
  const [nearbyStreets, setNearbyStreets] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [manualStreetInput, setManualStreetInput] = useState(false);

  const [nearbyNeighborhoods, setNearbyNeighborhoods] = useState<string[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] =
    useState(false);
  const [manualNeighborhoodInput, setManualNeighborhoodInput] = useState(false);

  const streetRef = useRef(street);
  const neighborhoodRef = useRef(neighborhood);

  useEffect(() => {
    streetRef.current = street;
  }, [street]);

  useEffect(() => {
    neighborhoodRef.current = neighborhood;
  }, [neighborhood]);

  console.log({
    latitude,
    longitude,
  });
  const mapRef = useRef<MapView>(null);
  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      error => {
        Alert.alert('Erro', 'Não foi possível obter a localização atual.');
        console.log('Error:', error);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 1000 },
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const fetchWithRetry = useCallback(async (
    url: string,
    retries = 2,
    options?: RequestInit,
  ): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);

        if (response.ok) return response;

        if (response.status === 504 || response.status === 429) {
          console.log(
            `Intento ${i + 1} falló con código ${
              response.status
            }. Reintentando...`,
          );
          await new Promise<void>(res => setTimeout(() => res(), 1500));
          continue;
        }

        throw new Error(`Error HTTP: ${response.status}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise<void>(res => setTimeout(() => res(), 1500));
      }
    }
    throw new Error('Falló la petición después de varios intentos');
  }, []);

  const fetchReverseAddress = useCallback(async (
    lat: number,
    lon: number,
  ): Promise<LocationAddress> => {
    const params = `format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const url = `https://nominatim.openstreetmap.org/reverse?${params}`;
    const response = await fetchWithRetry(url, 3, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'sysintel-appdengue',
      },
    });

    const data = await response.json();
    const address = data?.address || {};

    return {
      street: getFirstString(
        address.road,
        address.pedestrian,
        address.footway,
        address.cycleway,
        address.path,
        address.residential,
        data?.name,
      ),
      neighborhood: getFirstString(
        address.neighbourhood,
        address.suburb,
        address.city_district,
        address.district,
        address.quarter,
        address.residential,
      ),
    };
  }, [fetchWithRetry]);

  useEffect(() => {
    // Usamos un ref para saber si el componente sigue montado
    // y evitar actualizar estados si el usuario ya salió de la pantalla
    let isMounted = true;

    const fetchLocationData = async () => {
      // Evitamos llamar si las coordenadas son exactamente cero (a veces pasa al iniciar)
      if (!latitude || !longitude || latitude === 0 || longitude === 0) return;

      const connected = await hasInternet();
      if (!isMounted) return;
      setIsOnline(connected ?? true);

      if (!connected) {
        setManualStreetInput(true);
        setManualNeighborhoodInput(true);
        return;
      }

      setLoadingStreets(true);
      setLoadingNeighborhoods(true);

      try {
        const address = await fetchReverseAddress(latitude, longitude);
        if (!isMounted) return;

        if (address.street && !streetRef.current) {
          setStreet(address.street);
          streetRef.current = address.street;
          setManualStreetInput(false);
          setNearbyStreets(current =>
            current.includes(address.street!)
              ? current
              : [address.street!, ...current],
          );
        }

        if (address.neighborhood && !neighborhoodRef.current) {
          setNeighborhood(address.neighborhood);
          neighborhoodRef.current = address.neighborhood;
          setManualNeighborhoodInput(false);
          setNearbyNeighborhoods(current =>
            current.includes(address.neighborhood!)
              ? current
              : [address.neighborhood!, ...current],
          );
        }
      } catch (error) {
        console.log('Error fetching reverse address:', error);
      }

      try {
        // --- 1. OPTIMIZACIÓN DE QUERIES ---
        const radiusStreets = 60;
        const queryStreets = `[out:json][timeout:10];way(around:${radiusStreets},${latitude},${longitude})["highway"]["name"];out center;`;
        const urlStreets = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          queryStreets,
        )}`;

        const radiusNeighborhoods = 1500;
        const queryNeighborhoods = `[out:json][timeout:15];(node["place"~"suburb|neighbourhood"](around:${radiusNeighborhoods},${latitude},${longitude});way["place"~"suburb|neighbourhood"](around:${radiusNeighborhoods},${latitude},${longitude}););out center;`;
        const urlNeighborhoods = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          queryNeighborhoods,
        )}`;

        // --- USAMOS EL SISTEMA DE REINTENTOS AQUÍ ---
        const [responseStreets, responseNeighborhoods] = await Promise.all([
          fetchWithRetry(urlStreets, 2), // Intentará hasta 2 veces si da error 504
          fetchWithRetry(urlNeighborhoods, 2),
        ]);

        // (Ya puedes borrar los "if (!responseStreets.ok)" que tenías aquí,
        // porque fetchWithRetry asegura que la respuesta sea exitosa)

        // Leer los textos primero para asegurarnos de que no es HTML oculto
        const textStreets = await responseStreets.text();
        const textNeighborhoods = await responseNeighborhoods.text();

        // Verificar que empiecen con "{"
        if (!textStreets.trim().startsWith('{'))
          throw new Error('API Calles no devolvió JSON');
        if (!textNeighborhoods.trim().startsWith('{'))
          throw new Error('API Barrios no devolvió JSON');

        const dataStreets = JSON.parse(textStreets);
        const dataNeighborhoods = JSON.parse(textNeighborhoods);

        if (!isMounted) return;

        // --- PROCESAR CALLES ---
        const streetsWithDistance = (dataStreets.elements || [])
          .filter((el: any) => el.tags?.name && el.center)
          .map((el: any) => ({
            name: el.tags.name,
            distance: calculateDistance(
              latitude,
              longitude,
              el.center.lat,
              el.center.lon,
            ),
          }))
          .sort((a: any, b: any) => a.distance - b.distance);

        const uniqueStreets = Array.from(
          new Set<string>(streetsWithDistance.map((s: any) => s.name)),
        );
        const streetSuggestions =
          streetRef.current && !uniqueStreets.includes(streetRef.current)
            ? [streetRef.current, ...uniqueStreets]
            : uniqueStreets;
        setNearbyStreets(streetSuggestions);

        if (uniqueStreets.length > 0 && !streetRef.current) {
          setStreet(uniqueStreets[0]);
          streetRef.current = uniqueStreets[0];
          setManualStreetInput(false);
        } else if (uniqueStreets.length === 0 && !streetRef.current) {
          setManualStreetInput(true);
        }

        // --- PROCESAR BARRIOS ---
        const neighborhoodsWithDistance = (dataNeighborhoods.elements || [])
          .filter(
            (el: any) => el.tags?.name && (el.center || (el.lat && el.lon)),
          )
          .map((el: any) => {
            const lat = el.center?.lat || el.lat;
            const lon = el.center?.lon || el.lon;
            return {
              name: el.tags.name,
              distance: calculateDistance(latitude, longitude, lat, lon),
            };
          })
          .sort((a: any, b: any) => a.distance - b.distance);

        const uniqueNeighborhoods = Array.from(
          new Set<string>(neighborhoodsWithDistance.map((n: any) => n.name)),
        );
        const neighborhoodSuggestions =
          neighborhoodRef.current &&
          !uniqueNeighborhoods.includes(neighborhoodRef.current)
            ? [neighborhoodRef.current, ...uniqueNeighborhoods]
            : uniqueNeighborhoods;
        setNearbyNeighborhoods(neighborhoodSuggestions);

        if (uniqueNeighborhoods.length > 0 && !neighborhoodRef.current) {
          setNeighborhood(uniqueNeighborhoods[0]);
          neighborhoodRef.current = uniqueNeighborhoods[0];
          setManualNeighborhoodInput(false);
        } else if (
          uniqueNeighborhoods.length === 0 &&
          !neighborhoodRef.current
        ) {
          setManualNeighborhoodInput(true);
        }
      } catch (error) {
        console.log('Error fetching location data:', error);
        if (isMounted) {
          setManualStreetInput(!streetRef.current);
          setManualNeighborhoodInput(!neighborhoodRef.current);
        }
      } finally {
        if (isMounted) {
          setLoadingStreets(false);
          setLoadingNeighborhoods(false);
        }
      }
    };

    fetchLocationData();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, fetchReverseAddress, fetchWithRetry]);

  const handleSubmit = async () => {
    // 1. Validamos que todo esté lleno
    if (
      !neighborhood ||
      !street ||
      !number ||
      !responsible ||
      !latitude ||
      !longitude
    ) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }

    setLoading(true);

    // 2. Preparamos el objeto con los datos
    const newHouse = {
      neighborhood: neighborhood.trim(),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim(),
      latitude,
      longitude,
      responsible: responsible.trim(),
      owner,
      subdomain: userRedux?.subdomain,
      sector_id: zone?.sectorId,
    };

    try {
      // 3. LA MAGIA: Guardamos directamente en WatermelonDB (SQLite)
      // Esto es instantáneo y no depende del internet.
      await saveHouseInWatermelonDB(newHouse);

      // 4. Le avisamos al usuario y lo mandamos a la siguiente pantalla
      Alert.alert('Sucesso', 'Casa registrada com sucesso!');
      navigation.navigate('HouseInspection');
    } catch (error) {
      console.log('Error salvando en WatermelonDB:', error);
      Alert.alert('Erro', 'Não foi possível salvar a casa localmente.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   getCurrentLocation();
  // }, []);

  const animateToCurrentRegion = () => {
    if (latitude && longitude && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000,
      );
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (modalVisible) {
        setModalVisible(false); // Cierra el modal
        return true; // Previene comportamiento por defecto
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [modalVisible]);

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />

      <View style={tw`pt-8 `}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      <ScrollView contentContainerStyle={tw`p-4`}>
        <Text
          style={tw`mb-4 text-xl font-bold text-center text-blue-sysintel-900`}
        >
          Criar Casa
        </Text>

        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Bairro:
        </Text>

        {loadingNeighborhoods ? (
          <Text style={tw`mb-2 text-gray-500`}>
            Procurando bairros próximos...
          </Text>
        ) : manualNeighborhoodInput || !isOnline ? (
          <View>
            <TextInput
              style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
              placeholder="Digite o nome do bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
            {isOnline && nearbyNeighborhoods.length > 0 && (
              <TouchableOpacity
                onPress={() => setManualNeighborhoodInput(false)}
              >
                <Text style={tw`text-sm text-blue-sysintel-700 mb-2`}>
                  Voltar para lista de bairros sugeridos
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={tw`mb-4 border border-blue-sysintel-700 rounded-lg overflow-hidden`}
          >
            <TouchableOpacity
              style={tw`p-3 bg-gray-50 flex-row justify-between items-center`}
              onPress={() =>
                setShowNeighborhoodDropdown(!showNeighborhoodDropdown)
              }
            >
              <Text style={tw`text-blue-sysintel-900 flex-1`}>
                {neighborhood || 'Selecione um bairro próximo'}
              </Text>
              <Text style={tw`text-blue-sysintel-900`}>
                {showNeighborhoodDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showNeighborhoodDropdown && (
              <View style={tw`bg-white border-t border-gray-200 max-h-40`}>
                <ScrollView nestedScrollEnabled>
                  {nearbyNeighborhoods.map((n, index) => (
                    <TouchableOpacity
                      key={index}
                      style={tw`p-3 border-b border-gray-100 ${
                        neighborhood === n ? 'bg-blue-100' : ''
                      }`}
                      onPress={() => {
                        setNeighborhood(n);
                        setShowNeighborhoodDropdown(false);
                      }}
                    >
                      <Text style={tw`text-blue-sysintel-900`}>{n}</Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={tw`p-3 bg-gray-100`}
                    onPress={() => {
                      setManualNeighborhoodInput(true);
                      setShowNeighborhoodDropdown(false);
                      setNeighborhood('');
                    }}
                  >
                    <Text style={tw`text-blue-sysintel-800 font-bold`}>
                      + O bairro não está na lista (Digitar)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Bairro:
        </Text>
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Bairro"
          value={neighborhood}
          onChangeText={setNeighborhood}
        /> */}

        {/* <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Rua:
        </Text>
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Rua"
          value={street}
          onChangeText={setStreet}
        /> */}
        {/* --- SECCIÓN MODIFICADA: RUA (CALLE) --- */}
        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Rua:
        </Text>

        {loadingStreets ? (
          <Text style={tw`mb-2 text-gray-500`}>
            Procurando ruas próximas...
          </Text>
        ) : manualStreetInput || !isOnline ? (
          <View>
            <TextInput
              style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
              placeholder="Digite o nome da rua"
              value={street}
              onChangeText={setStreet}
            />
            {isOnline && nearbyStreets.length > 0 && (
              <TouchableOpacity onPress={() => setManualStreetInput(false)}>
                <Text style={tw`text-sm text-blue-sysintel-700 mb-2`}>
                  Voltar para lista de ruas sugeridas
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={tw`mb-2 border border-blue-sysintel-700 rounded-lg overflow-hidden`}
          >
            <TouchableOpacity
              style={tw`p-3 bg-gray-50 flex-row justify-between items-center`}
              onPress={() => setShowStreetDropdown(!showStreetDropdown)}
            >
              <Text style={tw`text-blue-sysintel-900 flex-1`}>
                {street || 'Selecione uma rua próxima'}
              </Text>
              <Text style={tw`text-blue-sysintel-900`}>
                {showStreetDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showStreetDropdown && (
              <View style={tw`bg-white border-t border-gray-200 max-h-40`}>
                <ScrollView nestedScrollEnabled>
                  {nearbyStreets.map((s, index) => (
                    <TouchableOpacity
                      key={index}
                      style={tw`p-3 border-b border-gray-100 ${
                        street === s ? 'bg-blue-100' : ''
                      }`}
                      onPress={() => {
                        setStreet(s);
                        setShowStreetDropdown(false);
                      }}
                    >
                      <Text style={tw`text-blue-sysintel-900`}>{s}</Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={tw`p-3 bg-gray-100`}
                    onPress={() => {
                      setManualStreetInput(true);
                      setShowStreetDropdown(false);
                      setStreet(''); // Limpiamos para que escriba
                    }}
                  >
                    <Text style={tw`text-blue-sysintel-800 font-bold`}>
                      + A rua não está na lista (Digitar)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        )}
        {/* --- FIN SECCIÓN RUA --- */}
        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Número:
        </Text>
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Número"
          keyboardType="numeric"
          value={number}
          onChangeText={setNumber}
        />
        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Complemento:
        </Text>
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Complemento"
          value={complement}
          onChangeText={setComplement}
        />
        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Responsável:
        </Text>
        <TextInput
          style={tw`p-2 mb-4 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Responsável"
          value={responsible}
          onChangeText={setResponsible}
        />

        <View style={tw`flex-row justify-between items-center mb-6 px-1`}>
          <Text style={tw`text-base font-bold text-blue-sysintel-900`}>
            É o dono da casa?
          </Text>
          <Switch
            value={owner}
            onValueChange={setOwner}
            trackColor={{ false: '#d1d5db', true: '#17375e' }}
            thumbColor={owner ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        {latitude && longitude ? (
          <>
            <Text style={tw`mb-2 text-lg font-bold text-blue-sysintel-800`}>
              Localização
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={tw`w-full mb-4 rounded-lg h-60`}
                region={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                }}
                onPress={e => {
                  setLatitude(e.nativeEvent.coordinate.latitude);
                  setLongitude(e.nativeEvent.coordinate.longitude);
                }}
              >
                <Marker coordinate={{ latitude, longitude }} />
              </MapView>
            </TouchableOpacity>
          </>
        ) : (
          <View style={tw`items-center justify-center h-40`}>
            <ActivityIndicator size="large" color="#17375e" />
            <Text style={tw`mt-2 text-blue-sysintel-900`}>
              Carregando localização...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={tw`p-3 bg-blue-sysintel-800 rounded-lg`}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Text style={tw`font-bold text-center text-white`}>
              Salvando...
            </Text>
          ) : (
            <Text style={tw`font-bold text-center text-white`}>Salvar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {latitude && longitude && (
        <Modal
          visible={modalVisible}
          transparent={false}
          onShow={animateToCurrentRegion}
        >
          <SafeAreaView style={tw`flex-1`}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={tw`flex-1`}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={e => {
                setLatitude(e.nativeEvent.coordinate.latitude);
                setLongitude(e.nativeEvent.coordinate.longitude);
              }}
            >
              <Marker coordinate={{ latitude, longitude }} />
            </MapView>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={tw`absolute p-4 bg-red-500 rounded-lg bottom-10 left-10`}
            >
              <Text style={tw`text-center text-white`}>Fechar</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default CreateHouse;
