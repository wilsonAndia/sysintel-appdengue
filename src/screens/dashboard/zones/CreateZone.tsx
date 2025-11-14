import React, {useRef, useState} from 'react';
import 'react-native-get-random-values';
import {
  SafeAreaView,
  View,
  Text,
  Animated,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
/* import Maps from './Maps'; */
import Navbar from '../../../components/NavBar';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import tw from '../../../../tailwind';
import MapView, {
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Svg, {Path} from 'react-native-svg';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';

const GOOGLE_API_KEY = 'AIzaSyD_F0e9hcjN_CWTYWn5wu1z_mSn7clnQY8';

interface Zone {
  name: string;
  latitude: string;
  longitude: string;
}

const CreateZone = () => {
  const [zone, setZone] = useState<Zone>({
    name: '',
    latitude: '',
    longitude: '',
  });

  const navigation = useNavigation<NavigationProp>();
  const [polygonCoords, setPolygonCoords] = useState<LatLng[]>([]);
  const [enabledDelete, setEnabledDelete] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [dragStartCoords, setDragStartCoords] = useState<LatLng | null>(null);
  const [originsCoords, setOriginsCoords] = useState<LatLng | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const generateSquarePolygon = (center: LatLng, distance: number = 0.005) => {
    setZone({
      ...zone,
      latitude: center.latitude.toString(),
      longitude: center.longitude.toString(),
    });
    return [
      {
        latitude: center.latitude + distance,
        longitude: center.longitude - distance,
      }, // Superior Izquierda
      {
        latitude: center.latitude + distance,
        longitude: center.longitude + distance,
      }, // Superior Derecha
      {
        latitude: center.latitude - distance,
        longitude: center.longitude + distance,
      }, // Inferior Derecha
      {
        latitude: center.latitude - distance,
        longitude: center.longitude - distance,
      }, // Inferior Izquierda
      {
        latitude: center.latitude + distance,
        longitude: center.longitude - distance,
      }, // Cerrar el polígono
    ];
  };

  const handleDragStart = (index: number, event: any) => {
    setDragStartCoords(event.nativeEvent.coordinate);
    setOriginsCoords(polygonCoords[index]);
  };

  const toggleDeleteMode = () => {
    setEnabledDelete(prev => !prev);

    // Animación de desplazamiento
    Animated.timing(toggleAnim, {
      toValue: enabledDelete ? 0 : 1, // 0 = Izquierda, 1 = Derecha
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Función para actualizar la posición de un punto arrastrado
  const handleDragEnd = (index: number, event: any) => {
    const newCoord = event.nativeEvent.coordinate;

    // Si la coordenada no cambió, restauramos la posición original
    if (
      dragStartCoords &&
      dragStartCoords.latitude === newCoord.latitude &&
      dragStartCoords.longitude === newCoord.longitude
    ) {
      const resetCoords = [...polygonCoords];

      resetCoords[index] = {
        latitude: originsCoords ? originsCoords.latitude - 0.000001 : 0,
        longitude: originsCoords ? originsCoords.longitude : 0,
      };
      setPolygonCoords(resetCoords);

      return;
    }

    const newCoords = [...polygonCoords];
    newCoords[index] = newCoord;

    // Generar puntos intermedios solo en los lados adyacentes
    const updatedCoords = generateIntermediatePoints(newCoords, index);
    setPolygonCoords(updatedCoords);
  };

  // Función para generar automáticamente puntos intermedios
  const generateIntermediatePoints = (
    coords: LatLng[],
    draggedIndex: number,
  ) => {
    let newCoords: LatLng[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      newCoords.push(coords[i]);

      // Solo generamos puntos intermedios en los lados adyacentes al índice arrastrado
      if (
        i === draggedIndex ||
        i === (draggedIndex - 1 + coords.length) % coords.length
      ) {
        const midPoint = {
          latitude: (coords[i].latitude + coords[i + 1].latitude) / 2,
          longitude: (coords[i].longitude + coords[i + 1].longitude) / 2,
        };
        newCoords.push(midPoint);
      }
    }

    newCoords.push(coords[0]); // Mantiene cerrado el polígono
    return newCoords;
  };

  const handleDeleteMarker = (index: number) => {
    // Si quedan menos de 4 coordenadas, no permitir eliminar

    if (polygonCoords.length <= 4) {
      Alert.alert('Aviso', 'Debe haber al menos 3 puntos en el área.');
      return;
    }

    // Filtrar las coordenadas eliminando la seleccionada
    let updatedCoords = polygonCoords.filter((_, i) => i !== index);

    if (index === 0) {
      updatedCoords = [...updatedCoords, updatedCoords[0]];
    }

    setPolygonCoords(updatedCoords);
  };

  const handleSaveZone = async () => {
    if (zone.name === '') {
      Alert.alert('Erro', 'El nombre de la zona es obligatorio.');
    } else if (zone.latitude === '' || zone.longitude === '') {
      Alert.alert('Erro', 'Debe escoger una zona.');
    } else if (polygonCoords.length < 4) {
      Alert.alert('Erro', 'Deben tener al menos 3 puntos de coordenadas');
    } else {
      console.log({
        name: zone.name,
        latitude: zone.latitude,
        longitude: zone.longitude,
        coordinates: polygonCoords,
      });
      try {
        const response = await fetchAxiosToken({
          url: 'region/',
          method: 'post',
          body: {
            name: zone.name,
            latitude: zone.latitude,
            longitude: zone.longitude,
            coordinates: polygonCoords.map(coord => ({
              latitude: String(coord.latitude), // Convertimos a string
              longitude: String(coord.longitude),
            })),
          },
        });

        console.log(response);

        Alert.alert('Sucesso', 'Zone criado com sucesso!');
        navigation.navigate('ZoneList');
      } catch (error: any) {
        console.log(
          'Error:',
          error.response ? error.response.data : error.message,
        );
      }
    }
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <Navbar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flexGrow: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <View style={{flex: 1, justifyContent: 'flex-start'}}>
          <Text style={tw`text-center text-2xl font-bold mb-4`}>
            Selecciona una ubicación
          </Text>

          <TextInput
            placeholder="Nombre de la zona"
            onChangeText={text => setZone({...zone, name: text})}
            style={tw`border bg-white border-gray-300 p-2 rounded-lg mb-4`}
          />

          {/* Buscador de Google Places */}

          <View style={{position: 'relative', zIndex: 1000}}>
            <GooglePlacesAutocomplete
              placeholder="Buscar ubicación"
              fetchDetails={true}
              query={{
                key: GOOGLE_API_KEY,
                language: 'es',
              }}
              onPress={(data, details = null) => {
                if (!details) return;

                const {lat, lng} = details.geometry.location;
                const center = {latitude: lat, longitude: lng};
                const newPolygon = generateSquarePolygon(center);

                setPolygonCoords(newPolygon);

                if (mapRef.current) {
                  mapRef.current.animateToRegion(
                    {
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    },
                    1000, // Duración de la animación en milisegundos
                  );
                }
              }}
              onFail={error => {
                console.log('Error en Google Places Autocomplete:', error);
              }}
              styles={{
                textInput: tw`border border-gray-300 p-3 rounded-lg`,
                listView: {
                  position: 'absolute',
                  top: 50, // Ajusta según sea necesario para que esté debajo del input
                  left: 0,
                  right: 0,
                  backgroundColor: 'white', // Asegúrate de que el fondo sea blanco para que se vea bien
                  zIndex: 999, // Z-index alto para que aparezca por encima del mapa
                },
              }}
            />
          </View>

          <View style={tw`h-[400px] relative mt-14`}>
            <View
              style={tw`absolute top-3 right-3 bg-white p-1 rounded-lg shadow-lg z-10`}>
              <View
                style={tw`w-16 h-8  ${
                  enabledDelete ? 'bg-green-200' : 'bg-gray-300'
                } rounded-md p-1 flex-row items-center`}>
                <Animated.View
                  style={[
                    tw`w-6 h-6 bg-white rounded-md shadow-lg`,
                    {
                      transform: [
                        {
                          translateX: toggleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 30], // Se mueve a la derecha
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Svg
                    style={tw`h-5 w-5 ${
                      enabledDelete ? 'text-green-500' : 'text-gray-500'
                    }`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path stroke="none" d="M0 0h24v24H0z" />
                    <Path d="M19 19h-11l-4 -4a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9 9" />
                    <Path d="M18 12.3l-6.3 -6.3" />
                  </Svg>
                </Animated.View>
              </View>

              <TouchableOpacity
                onPress={toggleDeleteMode}
                activeOpacity={0.8}
                style={tw`absolute top-0 right-0 bottom-0 left-0 justify-center items-center`}
              />
            </View>

            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{flex: 1}}
              initialRegion={{
                latitude: -16.528226,
                longitude: -68.153575,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}>
              {polygonCoords.length >= 3 && (
                <Polygon
                  coordinates={polygonCoords}
                  strokeColor="#FF0000"
                  fillColor="rgba(255, 0, 0, 0.3)"
                  strokeWidth={2}
                />
              )}

              {polygonCoords.slice(0, -1).map((coord, index) => (
                <Marker
                  key={index}
                  coordinate={coord}
                  draggable={!enabledDelete}
                  onDragStart={event => handleDragStart(index, event)}
                  onDragEnd={event => handleDragEnd(index, event)}
                  anchor={{x: 0.5, y: 0.5}} // Centra el marcador en la coordenada
                  calloutAnchor={{x: 0.5, y: 0.5}}
                  onPress={() => enabledDelete && handleDeleteMarker(index)} // Evita desajustes del tooltip
                >
                  <View
                    style={[
                      tw`items-center justify-center`,
                      {
                        transform: [{translateY: 10}, {translateX: 15}],
                      },
                    ]}>
                    {enabledDelete ? (
                      // Modo eliminación: Mostrar "X" roja
                      <Svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="red"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <Path d="M18 6L6 18" />
                        <Path d="M6 6l12 12" />
                      </Svg>
                    ) : (
                      // Modo normal: Punto rojo
                      <View style={tw`h-6 w-6 rounded-full bg-red-500`} />
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>

          <TouchableOpacity
            onPress={handleSaveZone}
            style={tw`bg-blue-500 p-3 rounded-lg`}>
            <Text style={tw`text-white text-center`}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateZone;
