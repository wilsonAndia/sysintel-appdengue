import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {FlatList} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';
import MapView, {LatLng, Polygon, PROVIDER_GOOGLE} from 'react-native-maps';

/* const GOOGLE_API_KEY = 'AIzaSyD_F0e9hcjN_CWTYWn5wu1z_mSn7clnQY8'; */

const GroupVisitScheduleCreate = () => {
  interface Leader {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  }

  interface Group {
    id: string;
    name: string;
    createdAt: string;
    leader: Leader;
    members: Leader[];
  }

  interface Zone {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
  }
  const navigation = useNavigation<NavigationProp>();
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalZoneVisible, setModalZoneVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [polygonCoords, setPolygonCoords] = useState<LatLng[]>([]);
  const getGroups = async () => {
    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `agent-groups/get-all`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setGroupList(response.payload);
      } else {
        console.log('Error al obtener grupos:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = React.useCallback(async () => {
    try {
      const response = await fetchAxiosToken({
        url: `region/?query=${searchTerm}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        const newZones = response.payload;

        /* setTotalPages(response.payload.totalPages);
          setPage(response.payload.currentPage); */
        setZones(newZones);
      } else {
        console.log('Error al obtener usuarios:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getGroups();
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Espera 500ms antes de actualizar el término de búsqueda

    return () => clearTimeout(handler); // Limpia el timeout si el usuario sigue escribiendo
  }, [searchTerm]);

  // Llama a getZones solo cuando el término de búsqueda se haya estabilizado
  useEffect(() => {
    fetchZones();
  }, [debouncedSearchTerm, fetchZones]);

  const getZoneDetail = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `zone/${id}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        const zoneResponse = response.payload;

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: Number(zoneResponse.latitude),
              longitude: Number(zoneResponse.longitude),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000, // Duración de la animación en milisegundos
          );
        }

        let coordinates: LatLng[] = [];
        zoneResponse.coordinates.map(
          (coord: {latitude: number; longitude: number}) =>
            coordinates.push({
              latitude: Number(coord.latitude), // Convertimos a string
              longitude: Number(coord.longitude),
            }),
        );
        setPolygonCoords(coordinates);
      } else {
        console.log('Error al obtener detalles del grupo:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedZone) {
      getZoneDetail(selectedZone.id);
    }
  }, [selectedZone]);

  const handleSave = async () => {
    if (!selectedZone || !selectedZone.id) {
      Alert.alert('Error', 'Debe seleccionar una zona.');
      return;
    }

    if (!selectedGroup) {
      Alert.alert('Error', 'Debe seleccionar un grupo.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Las fechas de inicio y fin son obligatorias.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert(
        'Error',
        'La fecha de inicio no puede ser mayor que la fecha final.',
      );
      return;
    }

    try {
      await fetchAxiosToken({
        url: 'group-visit-schedule/',
        method: 'post',
        body: {
          agentGroupId: selectedGroup,
          regionId: selectedZone.id,
          startDate,
          endDate,
        },
      });

      Alert.alert('Éxito', 'Zona creada con éxito.');
      navigation.navigate('GroupVisitScheduleList');
    } catch (error: any) {
      console.log(
        'Error:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1`}>
      <Navbar />
      <ScrollView contentContainerStyle={tw`p-4`}>
        <Text style={tw`text-2xl font-bold text-center mb-4`}>
          Agendar Grupo de Visita
        </Text>

        {/* Botón para seleccionar zona */}
        <TouchableOpacity
          onPress={() => setModalZoneVisible(true)}
          style={tw`bg-blue-500 p-3 rounded-full mb-4`}>
          <Text style={tw`text-white text-center font-semibold`}>
            {selectedZone ? selectedZone.name : 'Seleccionar zona'}
          </Text>
        </TouchableOpacity>

        {selectedZone && (
          <View style={tw`h-[300px] w-full rounded-lg overflow-hidden`}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{flex: 1}}
              initialRegion={{
                latitude: Number(selectedZone.latitude),
                longitude: Number(selectedZone.longitude),
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
            </MapView>
          </View>
        )}

        {/* Select de grupos */}
        <Text style={tw`text-lg mb-2`}>Seleccionar Grupo:</Text>
        <Picker selectedValue={selectedGroup} onValueChange={setSelectedGroup}>
          <Picker.Item label="Seleccione un grupo" value="" />
          {groupList.map(group => (
            <Picker.Item key={group.id} label={group.name} value={group.id} />
          ))}
        </Picker>

        {/* Selector de fecha de inicio */}
        <Text style={tw`text-lg mb-2`}>Fecha de Inicio:</Text>
        <TouchableOpacity
          onPress={() => setShowStartPicker(true)}
          style={tw`border p-3 rounded-lg mb-4`}>
          <Text>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {/* Selector de fecha de fin */}
        <Text style={tw`text-lg mb-2`}>Fecha de Fin:</Text>
        <TouchableOpacity
          onPress={() => setShowEndPicker(true)}
          style={tw`border p-3 rounded-lg mb-4`}>
          <Text>{endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={tw`bg-blue-500 p-3 rounded-lg mt-4`}>
          <Text style={tw`text-white text-center font-semibold`}>Guardar</Text>
        </TouchableOpacity>

        <Modal
          visible={modalZoneVisible}
          animationType="slide"
          transparent={true}>
          <View style={tw`flex-1 justify-center items-center bg-black/50`}>
            <View style={tw`bg-white p-6 rounded-lg w-11/12 relative`}>
              <Text style={tw`text-xl font-bold mb-4`}>
                Selecciona una Zona
              </Text>

              <TextInput
                style={tw`border border-gray-300 p-2 rounded-lg mb-3`}
                placeholder="Buscar zona..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />

              <FlatList
                data={zones}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={tw`p-3 border mt-2 rounded-lg border-gray-300`}
                    onPress={() => {
                      setSelectedZone(item);
                      setModalZoneVisible(false);
                    }}>
                    <Text style={tw`text-lg`}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={tw`absolute top-5 right-5 rounded-full bg-red-500 h-6 w-6 flex justify-center items-center`}
                onPress={() => setModalZoneVisible(false)}>
                <Text style={tw`text-white text-center font-semibold`}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GroupVisitScheduleCreate;
