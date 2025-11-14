import React, {useEffect, useState} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';

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

interface ApiResponse {
  statusCode: number;
  message: string;
  payload: Group[];
  errors: string[];
}

const GroupList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleGroup, setDeleGroup] = useState<string | null>(null);

  const getGroups = async () => {
    setLoading(true);
    try {
      const response: ApiResponse = await fetchAxiosToken({
        url: `agent-groups/get-all`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setGroups(response.payload);
      } else {
        console.log('Error al obtener grupos:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    setDeleting(true);
    setDeleGroup(groupId);
    try {
      const response = await fetchAxiosToken({
        url: `agent-groups/delete/${groupId}`,
        method: 'delete',
      });

      if (response.message === 'Ok') {
        setGroups(groups.filter(group => group.id !== groupId));
        Alert.alert('Sucesso', 'Grupo excluído com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível excluir o grupo.');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao excluir o grupo.');
    } finally {
      setDeleting(false);
      setDeleGroup(null);
    }
  };

  const confirmDelete = (groupId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza de que deseja excluir este grupo?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Excluir', onPress: () => deleteGroup(groupId)},
      ],
    );
  };

  useEffect(() => {
    getGroups();
  }, []);

  return (
    <SafeAreaView style={tw`w-full bg-white `}>
      <Navbar />

      <View
        style={tw`absolute flex-row items-center justify-end w-full px-4 py-2 top-16`}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          style={tw`z-40 w-32 px-1 py-2 bg-white border-2 border-[#003366] rounded-lg`}>
          <Text style={tw`text-lg font-bold text-center text-[#003366]`}>
            + Grupo
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={tw`items-center justify-center h-full mt-20 bg-white`}>
          <ActivityIndicator size="large" color="#17375e" />
          <Text style={tw`mt-4 text-lg text-gray-700`}>
            Carregando grupos...
          </Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={tw`h-full px-4 py-4 mt-32 bg-white`}>
          <Text style={tw`mt-4 text-lg text-center text-gray-700`}>
            Ainda não há grupos disponíveis.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`h-full px-4 py-2 mt-32 bg-white`}>
          <Text style={tw`mb-4 text-xl font-bold text-center text-gray-800`}>
            Lista de Grupos
          </Text>
          {groups.map(group => (
            <View
              key={group.id}
              style={tw`flex-row p-4 mb-4 bg-gray-100 rounded-lg shadow-md`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-bold text-gray-900`}>
                  {group.name}
                </Text>

                <Text style={tw`text-gray-600`}>
                  <Text style={tw`font-bold`}>Líder:</Text>{' '}
                  {group.leader.firstName} {group.leader.lastName}
                </Text>

                <Text style={tw`text-gray-600`}>
                  <Text style={tw`font-bold`}>Membros:</Text>{' '}
                  {group.members.length}
                </Text>

                <View style={tw`flex-row mt-2`}>
                  <TouchableOpacity
                    style={tw`flex-1 p-2 mr-2 bg-red-500 rounded-lg`}
                    onPress={() => confirmDelete(group.id)}
                    disabled={deleting && deleGroup === group.id}>
                    {deleting && deleGroup === group.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={tw`font-bold text-center text-white`}>
                        Excluir
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`flex-1 p-2 bg-[#003366] rounded-lg`}
                    onPress={() =>
                      navigation.navigate('GroupDetail', {id: group.id})
                    }>
                    <Text style={tw`font-bold text-center text-white`}>
                      Ver detalhes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default GroupList;
