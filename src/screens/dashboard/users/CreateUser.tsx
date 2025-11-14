import React, {useEffect, useState} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';
import {ButtonRegresar} from '../../../helpers/ButtonRegresar';

export enum RoleEnum {
  ADMIN = 'admin',
  SECRETARY = 'secretary',
  AGENT = 'agent',
}

interface Module {
  id: string;
  name: string;
}

const CreateUser = () => {
  const navigation = useNavigation<NavigationProp>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleEnum | null>(null);
  const [userTypes, setUserTypes] = useState<{id: string; name: string}[]>([]);
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserTypes = async () => {
      try {
        const response = await fetchAxiosToken({
          url: `users/get-all/type-user`,
          method: 'get',
        });

        if (response.statusCode === 200) {
          setUserTypes(response.payload);
        } else {
          console.log('Erro ao buscar tipos:', response.message);
        }
      } catch (error) {
        console.log('Erro:', error);
      }
    };

    getUserTypes();
  }, []);

  const handleSubmit = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert('Erro', 'Insira um email válido');
      return;
    }

    if (!firstName || !lastName || !phone || !selectedUserTypeId) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `users/register`,
        method: 'post',
        body: {
          firstName,
          lastName,
          phone,
          email,
          // rol: role,
          userTypeId: selectedUserTypeId,
        },
      });

      Alert.alert('Sucesso', 'Usuário criado com sucesso!');
      navigation.navigate('UserList');
    } catch (error) {
      console.log('Erro:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao criar o usuário.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <View>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      <ScrollView contentContainerStyle={tw`p-4`}>
        <Text style={tw`mb-4 text-xl font-bold text-center text-gray-800`}>
          Novo usuário
        </Text>

        <TextInput
          style={tw`p-2 mb-4 border border-gray-300 rounded-lg`}
          placeholder="Nome"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={tw`p-2 mb-4 border border-gray-300 rounded-lg`}
          placeholder="Sobrenome"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={tw`p-2 mb-4 border border-gray-300 rounded-lg`}
          placeholder="Telefone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={tw`p-2 mb-4 border border-gray-300 rounded-lg`}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={tw`mt-4 mb-2 text-lg font-bold text-gray-800`}>
          Tipo de usuário
        </Text>
        {userTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={tw`flex-row items-center mb-2`}
            onPress={() => setSelectedUserTypeId(type.id)}>
            <View
              style={tw`w-5 h-5 border ${
                selectedUserTypeId === type.id
                  ? 'bg-[#003366] border-[#003366]'
                  : 'bg-white border-gray-400'
              } rounded mr-2`}
            />
            <Text style={tw`text-gray-700 capitalize`}>{type.name}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={tw`p-3 mt-4 bg-[#003366] rounded-lg`}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={tw`font-bold text-center text-white`}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateUser;
