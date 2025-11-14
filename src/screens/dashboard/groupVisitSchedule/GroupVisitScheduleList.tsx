import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';

import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';
import Svg, {Circle, Path} from 'react-native-svg';

interface Region {
  id: string;
  name: string;
}

interface AgentGroup {
  id: string;
  name: string;
  memberCount: number;
}

interface GroupVisit {
  id: string;
  startDate: string;
  endDate: string;
  agentGroup: AgentGroup;
  region: Region;
}

interface Payload {
  data: GroupVisit[]; // <- Aquí debe ser un array
  total: number;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  payload: Payload;
  errors: string[];
}

const GroupVisitScheduleList = () => {
  const navigation = useNavigation<NavigationProp>();

  const [groupVisit, setGroupVisit] = useState<GroupVisit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [deleGroup, setDeleGroup] = useState<string>('');

  const fetchUsers = async (newPage: number = 1) => {
    setLoading(newPage === 1);
    setIsLoadingMore(newPage > 1);

    try {
      const response: ApiResponse = await fetchAxiosToken({
        url: `group-visit-schedule/?page=1&date=`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setGroupVisit(response.payload.data);
      } else {
        console.log('Error al obtener usuarios:', response.message);
      }
    } catch (error: any) {
      console.log(
        'Error:',
        error.response ? error.response.data : error.message,
      );
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const deleteGroup = async (id: string) => {
    setDeleting(true);
    setDeleGroup(id);
    try {
      const response = await fetchAxiosToken({
        url: `group-visit-schedule/${id}`,
        method: 'delete',
      });

      if (response.message === 'Ok') {
        setGroupVisit(groupVisit.filter(group => group.id !== id));
        Alert.alert('Sucesso', 'O usuário foi excluído');
      } else {
        Alert.alert('Erro', 'O usuário não pôde ser excluído');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao excluir o usuário');
    } finally {
      setDeleting(false);
      setDeleGroup('');
    }
  };

  const confirmDelete = (zoneId: string) => {
    Alert.alert(
      'Confirmar a exclusão',
      '¿Tem certeza de que deseja excluir esse group?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Excluir', onPress: () => deleteGroup(zoneId)},
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderUser = ({item: groupvisit}: {item: GroupVisit}) => {
    return (
      <View
        key={groupvisit.id}
        style={tw`flex-col p-4 mb-4 bg-gray-100 rounded-lg shadow-md`}>
        <View style={tw`flex-1 flex-col justify-start gap-3`}>
          {/* Zona */}
          <View style={tw`flex-row items-center gap-2`}>
            <Svg
              style={tw`h-8 w-8 text-blue-500`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </Svg>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              {groupvisit.region.name}
            </Text>
          </View>

          {/* Grupo */}
          <View style={tw`flex-row items-center gap-2`}>
            <Svg
              style={tw`h-8 w-8 text-blue-500`}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round">
              <Path stroke="none" d="M0 0h24v24H0z" />
              <Circle cx="9" cy="7" r="4" />
              <Path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
              <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <Path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
            </Svg>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              {groupvisit.agentGroup.name} ({groupvisit.agentGroup.memberCount}{' '}
              miembros)
            </Text>
          </View>

          {/* Fechas */}
          <View>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              {formatDate(groupvisit.startDate)} -{' '}
              {formatDate(groupvisit.endDate)}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row mt-2`}>
          <TouchableOpacity
            style={tw`flex-1 p-2 mr-2 bg-red-500 rounded-lg`}
            onPress={() => confirmDelete(groupvisit.id)}
            disabled={deleting && deleGroup === groupvisit.id}>
            {deleting && deleGroup === groupvisit.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`font-bold text-center text-white`}>Excluir</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 p-2 bg-[#003366] rounded-lg`}
            onPress={() =>
              navigation.navigate('GroupVisitScheduleDetail', {
                id: groupvisit.id,
              })
            }>
            <Text style={tw`font-bold text-center text-white`}>
              Ver detalhes
            </Text>
          </TouchableOpacity>
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
          onPress={() => navigation.navigate('GroupVisitScheduleCreate')}
          style={tw`w-32 px-1 py-2 bg-white border-2 border-blue-500 rounded-lg`}>
          <Text style={tw`text-lg font-bold text-center text-blue-500`}>
            + Group Visit
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

      <SafeAreaView style={tw`w-full h-full pt-32 bg-white`}>
        {loading && page === 1 ? (
          <View style={tw`items-center justify-center mt-20`}>
            <ActivityIndicator size="large" color="#17375e" />
            <Text style={tw`mt-4 text-lg text-gray-700`}>
              Carregando zones...
            </Text>
          </View>
        ) : groupVisit.length === 0 ? (
          <View style={tw`px-4 py-4`}>
            <Text style={tw`mt-4 text-lg text-center text-gray-700`}>
              Ainda não há zones disponíveis.
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupVisit}
            renderItem={renderUser}
            keyExtractor={groupVisit => groupVisit.id}
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

export default GroupVisitScheduleList;
