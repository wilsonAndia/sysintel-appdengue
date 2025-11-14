import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import tw from '../../../../tailwind';
import Geolocation from '@react-native-community/geolocation';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import axios from 'axios';
import Navbar from '../../../components/NavBar';
import {ButtonRegresar} from '../../../helpers/ButtonRegresar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Observation {
  id: string;
  date: string;
  latitude: string;
  longitude: string;
  detail: string;
  supervisor: Supervisor;
}

export interface Supervisor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  password_reset_code: any;
  first_login: boolean;
  enabled: boolean;
  avatar: string;
  updatedAt: string;
  createdAt: string;
  rol: string;
}

type ObservationsRouteProp = RouteProp<
  {Observations: {houseId: string}},
  'Observations'
>;

const Observations: React.FC = () => {
  const route = useRoute<ObservationsRouteProp>();
  const navigation = useNavigation();
  const {houseId} = route.params;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newDetail, setNewDetail] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const getObservations = async () => {
    await getLocation();

    try {
      const response = await fetchAxiosToken({
        url: `inspections/observations/${houseId}`,
        method: 'get',
      });

      console.log('response:', response.payload);

      if (response.statusCode === 200) {
        setObservations(response.payload);
      } else {
        Alert.alert('Erro', 'Falha ao buscar observações');
      }
    } catch (error) {
      console.log('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      error => {
        Alert.alert('Erro', 'Não foi possível obter a localização.');
        console.log('Erro localização:', error);
      },
      {enableHighAccuracy: false, timeout: 20000, maximumAge: 1000},
    );
  };

  const createObservation = async () => {
    if (!newDetail.trim()) {
      Alert.alert('Erro', 'Preencha a descrição.');
      return;
    }
    setCreating(true);

    try {
      const response = await fetchAxiosToken({
        url: `inspections/crate/observation`,
        method: 'post',
        body: {
          houseId,
          detail: newDetail,
          latitude,
          longitude,
        },
      });

      setNewDetail('');
      setModalVisible(false);
      getObservations();
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível criar a observação.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    getObservations();
  }, []);

  return (
    <View style={tw`flex-1 bg-white`}>
      <Navbar />
      <View style={tw`px-4 mt-10`}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      <View style={tw`flex-row items-center justify-between px-4 mt-4`}>
        <Text style={tw`text-xl font-bold text-blue-sysintel-800`}>
          Observações
        </Text>
        <TouchableOpacity
          style={tw`px-4 py-2 bg-blue-sysintel-800 rounded-lg`}
          onPress={() => setModalVisible(true)}>
          <Text style={tw`font-bold text-white`}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={tw`mt-10`} size="large" color="#003366" />
      ) : (
        <FlatList
          data={observations}
          keyExtractor={item => item.id}
          contentContainerStyle={tw`px-4 py-4`}
          renderItem={({item}) => (
            <View style={tw`p-4 mb-4 bg-blue-sysintel-100 rounded-lg shadow`}>
              <Text style={tw`text-blue-sysintel-900 font-semibold`}>
                {item.detail}
              </Text>
              <Text style={tw`mt-2 text-sm text-blue-sysintel-800`}>
                Supervisor: {item.supervisor.firstName}{' '}
                {item.supervisor.lastName}
              </Text>
              <Text style={tw`text-sm text-blue-sysintel-700`}>
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={tw`items-center justify-center flex-1 bg-black/60`}>
          <View style={tw`p-4 bg-white rounded-lg w-80`}>
            <Text
              style={tw`mb-2 text-lg text-blue-sysintel-900 font-bold text-center`}>
              Nova Observação
            </Text>
            <TextInput
              style={tw`p-2 mb-4 border border-blue-sysintel-900 text-blue-sysintel-900 rounded-lg`}
              placeholder="Descreva a observação"
              multiline
              numberOfLines={4}
              value={newDetail}
              onChangeText={setNewDetail}
            />

            <TouchableOpacity
              style={tw`p-2 mb-2 bg-blue-sysintel-900 rounded-lg`}
              onPress={createObservation}>
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`font-bold text-center text-white`}>Salvar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`p-2 bg-red-500 rounded-lg`}
              onPress={() => setModalVisible(false)}>
              <Text style={tw`text-center text-white`}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Observations;
