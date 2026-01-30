import React, { use, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../../helpers/types/navigationProp';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import { Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { saveHouseLocal } from '../../../database/services/houseService';
import { hasInternet } from '../../../helpers/checkConnection';

const CreateHouse = () => {
  const navigation = useNavigation<NavigationProp>();
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [responsible, setResponsible] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const zone = useSelector((state: RootState) => state.zones.selectedZone);

  const userRedux = useSelector((state: RootState) => state.auth.user);
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

  // const handleSubmit = async () => {
  //   if (
  //     !neighborhood ||
  //     !street ||
  //     !number ||
  //     !responsible ||
  //     !latitude ||
  //     !longitude
  //   ) {
  //     Alert.alert('Erro', 'Todos os campos são obrigatórios.');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await fetchAxiosToken({
  //       url: `inspections/house`,
  //       method: 'post',
  //       body: {
  //         neighborhood: neighborhood.trim(),
  //         street: street.trim(),
  //         number: number.trim(),
  //         complement: complement.trim(),
  //         latitude,
  //         longitude,
  //         responsible: responsible.trim(),
  //       },
  //       subdomain: userRedux?.subdomain,
  //     });

  //     if (response.statusCode === 201) {
  //       Alert.alert('Sucesso', 'Casa criada com sucesso!');
  //       navigation.navigate('HouseInspection');
  //     } else {
  //       Alert.alert('Erro', 'Não foi possível criar a casa.');
  //     }
  //   } catch (error) {
  //     console.log('Error:', error);
  //     Alert.alert('Erro', 'Houve um problema ao criar a casa.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async () => {
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

    const newHouse = {
      neighborhood: neighborhood.trim(),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim(),
      latitude,
      longitude,
      responsible: responsible.trim(),
      subdomain: userRedux?.subdomain,
      sector_id: zone?.sectorId,
    };
    console.log('New House:', newHouse);
    const connected = await hasInternet();
    try {
      if (connected) {
        console.log('Online: enviando ao servidor');
        const response = await fetchAxiosToken({
          url: `inspections/house`,
          method: 'post',
          body: newHouse,
          subdomain: userRedux?.subdomain,
        });
        console.log('Response:', response);
        if (response.statusCode === 201) {
          await saveHouseLocal({
            ...newHouse,
            backend_id: response.payload.id,
            sync_status: 'synced',
          });

          Alert.alert('Sucesso', 'Casa criada com sucesso!');

          Alert.alert('Sucesso', 'Casa criada com sucesso!');
        } else {
          throw new Error('Falha ao criar a casa no servidor');
        }
      } else {
        // SIN INTERNET → guardar localmente
        await saveHouseLocal({
          ...newHouse,
          backend_id: null,
          sync_status: 'pending',
        });
        Alert.alert(
          'Offline',
          'Sem internet, casa salva localmente e será sincronizada depois.',
        );
      }

      navigation.navigate('HouseInspection');
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Não foi possível salvar a casa.');
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
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Bairro"
          value={neighborhood}
          onChangeText={setNeighborhood}
        />

        <Text style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}>
          Rua:
        </Text>
        <TextInput
          style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
          placeholder="Rua"
          value={street}
          onChangeText={setStreet}
        />
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
