import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import tw from '../../../../tailwind';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../../helpers/types/navigationProp';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import Navbar from '../../../components/NavBar';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import { API_URL } from '@env';

type UserDetailRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  rol: string;
  modules: Module[];
}

interface Module {
  id: string;
  name: string;
}

const UserDetail = () => {
  const route = useRoute<UserDetailRouteProp>();
  const { id } = route.params;

  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const getUserDetail = async () => {
    try {
      const response = await fetchAxiosToken({
        url: `users/getOne/${id}`,
        method: 'get',
      });
      console.log('response detail users', response);
      if (response.statusCode === 200) {
        setUser(response.payload);
        setSelectedModules(
          response.payload.modules.map((module: Module) => module.id),
        );
      } else {
        console.log('Error al obtener el usuario:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModules = async () => {
    try {
      const response = await fetchAxiosToken({
        url: `modules/list-modules`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setModules(response.payload);
        await getUserDetail();
      } else {
        console.log('Error al obtener módulos:', response.message);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  useEffect(() => {
    getModules();
  }, [id]);

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const handleUpdateModules = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const response = await fetchAxiosToken({
        url: `modules/associate-user`,
        method: 'post',
        body: {
          moduleId: selectedModules,
          userId: user.id,
        },
      });

      if (response.statusCode === 200) {
        Alert.alert('Sucesso', 'Módulos atualizados com sucesso!');
        getUserDetail();
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar os módulos.');
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erro', 'Houve um problema ao atualizar os módulos.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={tw`items-center justify-center w-full h-full bg-white`}
      >
        <ActivityIndicator size="large" color="#17375e" />
        <Text style={tw`mt-4 text-lg text-gray-700`}>Carregando ...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={tw`bg-white `}>
        <Navbar />
        <ScrollView contentContainerStyle={tw`h-full px-4 mt-20`}>
          <View>
            <ButtonRegresar textColor="white" arrowColor="white" />
          </View>
          <View
            style={tw`items-center justify-center flex-1 h-full text-lg text-gray-700`}
          >
            <Text style={tw`text-lg text-gray-700`}>
              Nenhum dado de usuário foi encontrado.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex w-full bg-white`}>
      <Navbar />
      <ScrollView contentContainerStyle={tw`h-full p-4 mt-20`}>
        <View style={tw`mb-6 -ml-3 `}>
          <ButtonRegresar textColor="white" arrowColor="white" />
        </View>
        <Text style={tw`mb-4 text-2xl font-bold text-gray-800`}>
          Detalhes do usuário
        </Text>
        <View style={tw`p-4 mb-6 bg-gray-100 rounded-lg`}>
          <View style={tw`items-center mb-4`}>
            <Image
              source={{
                uri: `${API_URL}users/getImage/${user.avatar}`,
              }}
              style={tw`w-24 h-24 rounded-full`}
              resizeMode="cover"
            />
          </View>

          <Text style={tw`text-lg text-gray-700`}>
            <Text style={tw`font-bold`}>Nome:</Text> {user.firstName}{' '}
            {user.lastName}
          </Text>
          <Text style={tw`text-lg text-gray-700`}>
            <Text style={tw`font-bold`}>E-mail:</Text> {user.email}
          </Text>
          <Text style={tw`text-lg text-gray-700`}>
            <Text style={tw`font-bold`}>Telefone:</Text> {user.phone}
          </Text>
          <Text style={tw`text-lg text-gray-700`}>
            <Text style={tw`font-bold`}>Rol:</Text> {user.rol}
          </Text>
        </View>

        <Text style={tw`mb-2 text-lg font-bold text-gray-800`}>Módulos</Text>
        {modules.map(module => (
          <TouchableOpacity
            key={module.id}
            style={tw`flex-row items-center mb-2`}
            onPress={() => toggleModuleSelection(module.id)}
          >
            <View
              style={tw`w-5 h-5 border ${
                selectedModules.includes(module.id)
                  ? 'bg-[#003366] border-[#003366]'
                  : 'bg-white border-gray-400'
              } rounded mr-2`}
            />
            <Text style={tw`text-gray-700`}>{module.name}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={tw`p-3 mt-6 bg-[#003366] rounded-lg`}
          onPress={handleUpdateModules}
          disabled={updating}
        >
          {updating ? (
            <Text style={tw`font-bold text-center text-white`}>
              Atualização...
            </Text>
          ) : (
            <Text style={tw`font-bold text-center text-white`}>
              Atualização de módulos
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserDetail;
