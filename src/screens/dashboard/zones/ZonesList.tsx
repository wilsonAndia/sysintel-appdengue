import React, {useEffect, useState} from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';

import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';

interface Zone {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  payload: Zone[];
  errors: string[];
}

const ZonesList = () => {
  const navigation = useNavigation<NavigationProp>();

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [deleZone, seDeleZone] = useState<string>('');

  const fetchUsers = async (newPage: number = 1) => {
    setLoading(newPage === 1);
    setIsLoadingMore(newPage > 1);

    try {
      const response: ApiResponse = await fetchAxiosToken({
        url: `region/?query=${searchTerm}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        const newZones = response.payload;

        /* setTotalPages(response.payload.totalPages);
        setPage(response.payload.currentPage); */
        setZones(prevZones =>
          newPage === 1 ? newZones : [...prevZones, ...newZones],
        );
      } else {
        console.log('Error al obtener usuarios:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const deleteZone = async (zoneId: string) => {
    setDeleting(true);
    seDeleZone(zoneId);
    try {
      const response = await fetchAxiosToken({
        url: `region/${zoneId}`,
        method: 'delete',
      });

      if (response.message === 'Ok') {
        setZones(zones.filter(zone => zone.id !== zoneId));
        Alert.alert('Sucesso', 'O usuário foi excluído');
      } else {
        Alert.alert('Erro', 'O usuário não pôde ser excluído');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao excluir o usuário');
    } finally {
      setDeleting(false);
      seDeleZone('');
    }
  };

  const confirmDelete = (zoneId: string) => {
    Alert.alert(
      'Confirmar a exclusão',
      '¿Tem certeza de que deseja excluir esse usuário?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Excluir', onPress: () => deleteZone(zoneId)},
      ],
    );
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderUser = ({item: zone}: {item: Zone}) => {
    return (
      <View
        key={zone.id}
        style={tw`flex-row p-4 mb-4 bg-gray-100 rounded-lg shadow-md`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>{zone.name}</Text>

          <View style={tw`flex-row mt-2`}>
            <TouchableOpacity
              style={tw`flex-1 p-2 mr-2 bg-red-500 rounded-lg`}
              onPress={() => confirmDelete(zone.id)}
              disabled={deleting && deleZone === zone.id}>
              {deleting && deleZone === zone.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={tw`font-bold text-center text-white`}>
                  Excluir
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 p-2 bg-[#003366] rounded-lg`}
              onPress={() => navigation.navigate('ZoneDetail', {id: zone.id})}>
              <Text style={tw`font-bold text-center text-white`}>
                Ver detalhes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`w-full bg-white`}>
      <Navbar />
      <View
        style={tw`absolute z-10 flex-row items-center justify-end w-full px-4 py-2 top-16`}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateZone')}
          style={tw`w-32 px-1 py-2 bg-white border-2 border-blue-500 rounded-lg`}>
          <Text style={tw`text-lg font-bold text-center text-blue-500`}>
            + Zona
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={tw`absolute z-10 flex-row items-center justify-between w-full px-4 py-2 top-32`}>
        <TextInput
          style={tw`flex-1 p-2 border border-gray-300 rounded-lg`}
          placeholder="Buscar por nome"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={tw`ml-2 px-4 py-2 bg-[#003366] rounded-lg`}>
          <Text style={tw`font-bold text-white`}>Buscar</Text>
        </TouchableOpacity>
      </View>
      <SafeAreaView style={tw`w-full h-full pt-48 bg-white`}>
        {loading && page === 1 ? (
          <View style={tw`items-center justify-center mt-20`}>
            <ActivityIndicator size="large" color="#17375e" />
            <Text style={tw`mt-4 text-lg text-gray-700`}>
              Carregando zones...
            </Text>
          </View>
        ) : zones.length === 0 ? (
          <View style={tw`px-4 py-4`}>
            <Text style={tw`mt-4 text-lg text-center text-gray-700`}>
              Ainda não há zones disponíveis.
            </Text>
          </View>
        ) : (
          <FlatList
            data={zones}
            renderItem={renderUser}
            keyExtractor={zone => zone.id}
            contentContainerStyle={tw`px-4 `}
            /*  onEndReached={() => fetchUsers(page + 1)} */
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="small" color="#17375e" />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default ZonesList;
