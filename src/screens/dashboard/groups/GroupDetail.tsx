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
  Image,
  ScrollView,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {
  NavigationProp,
  RootStackParamList,
} from '../../../helpers/types/navigationProp';
import {ButtonRegresar} from '../../../helpers/ButtonRegresar';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
}

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

const GroupDetail = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupDetailRouteProp>();
  const {id} = route.params;

  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getGroupDetail = async () => {
    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `agent-groups/get-one/${id}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        const group = response.payload;
        setGroupName(group.name);
        setLeaderId(group.leader.id);
        setSelectedMembers([...group.members]);
      } else {
        console.log('Error al obtener detalles del grupo:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number, search: string = '') => {
    setLoadingUsers(true);
    try {
      const response = await fetchAxiosToken({
        url: `users/list-users?page=${page}&limit=10&name=${search}`,
        method: 'post',
      });

      if (response.statusCode === 200) {
        const filteredResults = response.payload.results.filter(
          (user: User) =>
            !selectedMembers.some(member => member.id === user.id),
        );

        setUsers(page === 1 ? filteredResults : [...users, ...filteredResults]);
        setHasMore(page < response.payload.totalPages);
      } else {
        console.log('Error al obtener usuarios:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Agregar un usuario a los miembros seleccionados
  const addMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user]);
    setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
  };

  // Eliminar un usuario de los miembros seleccionados
  const removeMember = (userId: string) => {
    const removedUser = selectedMembers.find(member => member.id === userId);
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));

    if (removedUser) {
      setUsers(prevUsers => [removedUser, ...prevUsers]); // Devolver a la lista principal
    }

    if (leaderId === userId) {
      setLeaderId(null); // Si es líder, removerlo como líder
    }
  };

  // Establecer un líder
  const selectLeader = (userId: string) => {
    if (!selectedMembers.find(member => member.id === userId)) {
      Alert.alert('Erro', 'O líder deve ser um dos membros selecionados.');
      return;
    }
    setLeaderId(userId);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingUsers) {
      setPage(prev => prev + 1);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, search);
  };

  const handleUpdate = async () => {
    if (!groupName || !leaderId || selectedMembers.length === 0) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `agent-groups/update/${id}`,
        method: 'post',
        body: {
          name: groupName,
          leaderId,
          memberIds: selectedMembers.map(member => member.id),
        },
      });

      if (response.statusCode === 200) {
        Alert.alert('Sucesso', 'Grupo atualizado com sucesso!');
        navigation.navigate('GroupList');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o grupo.');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao atualizar o grupo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
    getGroupDetail();
  }, [page]);

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <ButtonRegresar textColor="white" arrowColor="white" />

      <Text style={tw`mb-4 text-xl font-bold text-center text-gray-800`}>
        Detalhes do Grupo
      </Text>

      <TextInput
        style={tw`p-2 mx-4 mb-4 border border-gray-300 rounded-lg`}
        placeholder="Nome do Grupo"
        value={groupName}
        onChangeText={setGroupName}
      />

      <View style={tw`flex-row items-center justify-between px-4 mb-4`}>
        <TextInput
          style={tw`flex-1 p-2 border border-gray-300 rounded-lg`}
          placeholder="Buscar por nome"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={tw`ml-2 px-4 py-2 bg-[#003366] rounded-lg`}>
          <Text style={tw`font-bold text-white`}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`h-30`} contentContainerStyle={tw`px-2`}>
        <Text style={tw`mx-4 mb-2 text-lg font-bold text-gray-800`}>
          Usuários
        </Text>
        <FlatList
          data={users}
          keyExtractor={user => user.id}
          renderItem={({item: user}) => (
            <TouchableOpacity
              style={tw`flex-row items-center px-4 mb-2`}
              onPress={() => addMember(user)}>
              <Image
                source={{
                  uri: `${process.env.API_URL}users/getImage/${user.avatar}`,
                }}
                style={tw`w-10 h-10 mr-4 rounded-full`}
                resizeMode="cover"
              />
              <Text style={tw`text-gray-700`}>
                {user.firstName} {user.lastName}
              </Text>
            </TouchableOpacity>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingUsers ? (
              <ActivityIndicator size="small" color="#17375e" />
            ) : null
          }
        />
      </ScrollView>

      <View style={tw`px-4 py-4`}>
        <Text style={tw`mb-2 text-lg font-bold text-gray-800`}>
          Usuários Selecionados
        </Text>
        <ScrollView style={tw`h-40`} contentContainerStyle={tw`px-2`}>
          {selectedMembers.map(member => (
            <View
              key={member.id}
              style={tw`flex-row items-center justify-between mb-2 p-2 ${
                leaderId === member.id ? 'bg-green-100' : 'bg-blue-100'
              } rounded-lg`}>
              <Text style={tw`text-gray-700`}>
                {member.firstName} {member.lastName}
              </Text>
              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  onPress={() => selectLeader(member.id)}
                  style={tw`p-1 px-2 bg-green-500 rounded-lg`}>
                  <Text style={tw`text-white`}>Líder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeMember(member.id)}
                  style={tw`p-1 px-2 ml-2 bg-red-500 rounded-lg`}>
                  <Text style={tw`text-white`}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={tw`p-3 mt-2 mb-4 bg-[#003366] mx-4 rounded-lg`}
        onPress={handleUpdate}
        disabled={loading}>
        {loading ? (
          <Text style={tw`font-bold text-center text-white`}>Salvando...</Text>
        ) : (
          <Text style={tw`font-bold text-center text-white`}>Salvar</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default GroupDetail;
