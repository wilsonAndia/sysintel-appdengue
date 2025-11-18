import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useNavigation } from '@react-navigation/native';
import {
  NavigationProp,
  RootStackParamList,
} from '../../../helpers/types/navigationProp';
import { API_URL } from '@env';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  rol: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  payload: {
    results: User[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
  errors: string[];
}

const UserList = () => {
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const navigation = useNavigation<NavigationProp>();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [deleUser, seDeleUser] = useState<string>('');

  const fetchUsers = async (newPage: number = 1) => {
    if (newPage > totalPages) return;
    setLoading(newPage === 1);
    setIsLoadingMore(newPage > 1);

    try {
      const response: ApiResponse = await fetchAxiosToken({
        url: `users/list-users?page=${newPage}&limit=10&name=${searchTerm}`,
        method: 'post',
      });

      console.log('response.payload.results', response.payload.results.length);
      if (response.statusCode === 200) {
        const newUsers = response.payload.results;

        setTotalPages(response.payload.totalPages);
        setPage(response.payload.currentPage);
        setUsers(prevUsers =>
          newPage === 1 ? newUsers : [...prevUsers, ...newUsers],
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

  const deleteUser = async (userId: string) => {
    setDeleting(true);
    seDeleUser(userId);
    try {
      const response = await fetchAxiosToken({
        url: `users/delete-user`,
        method: 'post',
        body: { userDelete: userId },
      });

      if (response.message === 'Ok') {
        setUsers(users.filter(user => user.id !== userId));
        Alert.alert('Sucesso', 'O usuário foi excluído');
      } else {
        Alert.alert('Erro', 'O usuário não pôde ser excluído');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao excluir o usuário');
    } finally {
      setDeleting(false);
      seDeleUser('');
    }
  };

  const confirmDelete = (userId: string) => {
    Alert.alert(
      'Confirmar a exclusão',
      '¿Tem certeza de que deseja excluir esse usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => deleteUser(userId) },
      ],
    );
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const renderUser = ({ item: user }: { item: User }) => {
    if (user.id !== userRedux?.id) {
      return (
        <View
          key={user.id}
          style={tw`flex-row p-4 mb-4 bg-gray-100 rounded-lg shadow-md`}
        >
          <Image
            source={{
              uri: `${API_URL}users/getImage/${user.avatar}`,
            }}
            style={tw`w-16 h-16 mr-4 rounded-full`}
            resizeMode="cover"
          />
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={tw`text-gray-600`}>Email: {user.email}</Text>
            <Text style={tw`text-gray-600`}>Rol: {user.rol}</Text>
            <View style={tw`flex-row mt-2`}>
              <TouchableOpacity
                style={tw`flex-1 p-2 mr-2 bg-red-500 rounded-lg`}
                onPress={() => confirmDelete(user.id)}
                disabled={deleting && deleUser === user.id}
              >
                {deleting && deleUser === user.id ? (
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
                  navigation.navigate('UserDetail', { id: user.id })
                }
              >
                <Text style={tw`font-bold text-center text-white`}>
                  Ver detalhes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={tw`w-full bg-white`}>
      <Navbar />
      <View
        style={tw`absolute z-10 flex-row items-center justify-end w-full px-4 py-2 top-16`}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateUser')}
          style={tw`w-32 px-1 py-2 bg-white border-2 border-blue-500 rounded-lg`}
        >
          <Text style={tw`text-lg font-bold text-center text-blue-500`}>
            + Usuário
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={tw`absolute z-10 flex-row items-center justify-between w-full px-4 py-2 top-32`}
      >
        <TextInput
          style={tw`flex-1 p-2 border border-gray-300 rounded-lg`}
          placeholder="Buscar por nome"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={tw`ml-2 px-4 py-2 bg-[#003366] rounded-lg`}
        >
          <Text style={tw`font-bold text-white`}>Buscar</Text>
        </TouchableOpacity>
      </View>
      <SafeAreaView style={tw`w-full h-full pt-48 bg-white`}>
        {loading && page === 1 ? (
          <View style={tw`items-center justify-center mt-20`}>
            <ActivityIndicator size="large" color="#17375e" />
            <Text style={tw`mt-4 text-lg text-gray-700`}>
              Carregando usuários...
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={tw`px-4 py-4`}>
            <Text style={tw`mt-4 text-lg text-center text-gray-700`}>
              Ainda não há usuários disponíveis.
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={user => user.id}
            contentContainerStyle={tw`px-4 `}
            onEndReached={() => fetchUsers(page + 1)}
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

export default UserList;
