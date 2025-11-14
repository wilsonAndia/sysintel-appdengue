import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Navbar from '../../../components/NavBar';
import tw from '../../../../tailwind';
import {TextInput} from 'react-native-gesture-handler';
import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Dialog,
  Toast,
} from 'react-native-alert-notification';
import axios from 'axios';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import {setUser} from '../../../redux/authSlice';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

const EditarPerfil: React.FC = () => {
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    getDataFamiliar();
  }, [userRedux]);

  const getDataFamiliar = async () => {
    /*  console.log(userRedux?.id); */
    const response = await axios.get(
      `${process.env.API_URL}users/getOne/${userRedux?.id}`,
    );
    console.log('perfil', response.data.payload);
    setCurrentUser({
      id: response.data.payload.id,
      firstName: response.data.payload.firstName,
      lastName: response.data.payload.lastName,
      phone: response.data.payload.phone,
      email: response.data.payload.email,
    });
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setCurrentUser(prevState => ({
      ...prevState,
      [field]: value, // Actualiza el campo correspondiente
    }));
  };

  const handleRegister = async () => {
    // Validación simple para campos vacíos
    if (
      !currentUser.firstName ||
      !currentUser.lastName ||
      !currentUser.phone ||
      !currentUser.email
    ) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentUser.email)) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Digite um endereço de e-mail válido.',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', currentUser.firstName);
      formData.append('lastName', currentUser.lastName);
      formData.append('phone', currentUser.phone);
      formData.append('email', currentUser.email);

      await axios.put(
        `${process.env.API_URL}users/updateProfile/${currentUser.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-subdomain': userRedux?.subdomain || '',
          },
        },
      );

      dispatch(
        setUser({
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: currentUser.phone,
          avatar: userRedux?.avatar || '',
          first_login: false,
          subdomain: userRedux?.subdomain || '',
        }),
      );
      setLoading(false);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Atualização bem-sucedida!',
        textBody: 'Seu usuário foi atualizado',
        autoClose: 500,
      });

      return;
    } catch (error) {
      console.log(error);
      setLoading(false);

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Houve um problema. Por favor, tente novamente.',
        button: 'Cerrar',
      });
    }
  };
  console.log('userRedux', userRedux);
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <Navbar />
      <ScrollView contentContainerStyle={tw``}>
        <AlertNotificationRoot>
          <View style={tw`flex mt-24`}>
            <Text
              style={tw`text-xl font-bold text-center text-blue-sysintel-900`}>
              Editar Perfil
            </Text>
            <Text style={tw`mb-4 text-sm text-center text-red-500`}>
              * Indica os campos obrigatórios
            </Text>
            <View style={tw`flex-col items-center justify-center mt-1`}>
              <View
                style={tw`flex-col items-start justify-center w-5/6 gap-1 p-2 px-5 mx-auto rounded-md `}>
                <View style={tw`flex-row items-start justify-center `}>
                  <Text style={tw`text-blue-sysintel-800 font-semibold   `}>
                    Nome :{' '}
                  </Text>
                  <Text style={tw`text-red-500 `}>* </Text>
                </View>

                <View style={tw`flex-1  w-full `}>
                  <TextInput
                    style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                    value={currentUser.firstName}
                    onChangeText={text => handleInputChange('firstName', text)}
                  />
                </View>
              </View>
            </View>

            <View
              style={tw`flex-col items-start justify-center w-5/6 gap-1 p-2 px-5 mx-auto rounded-md `}>
              <View style={tw`flex-row items-start justify-center `}>
                <Text style={tw`text-blue-sysintel-800 font-semibold  `}>
                  Sobrenome :{' '}
                </Text>
                <Text style={tw`text-red-500 `}>* </Text>
              </View>
              <View style={tw`flex-1 w-full `}>
                <TextInput
                  style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900 `}
                  value={currentUser.lastName}
                  onChangeText={text => handleInputChange('lastName', text)}
                />
              </View>
            </View>

            <View
              style={tw`flex-col items-start justify-center w-5/6 gap-1 p-2 px-5 mx-auto rounded-md `}>
              <View style={tw`flex-row items-start justify-center `}>
                <Text style={tw`text-blue-sysintel-800 font-semibold   `}>
                  Telefone :{' '}
                </Text>
              </View>
              <View style={tw`flex-1  w-full `}>
                <TextInput
                  style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                  value={currentUser.phone}
                  onChangeText={text => handleInputChange('phone', text)}
                />
              </View>
            </View>

            <View
              style={tw`flex-col items-start justify-center w-5/6 gap-1 p-2 px-5 mx-auto rounded-md `}>
              <View style={tw`flex-row items-start justify-center `}>
                <Text style={tw`text-blue-sysintel-800  font-semibold  `}>
                  E-mail :{' '}
                </Text>
                <Text style={tw`text-red-500 `}>* </Text>
              </View>
              <View style={tw`flex-1 w-full `}>
                <TextInput
                  style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                  value={currentUser.email}
                  onChangeText={text => handleInputChange('email', text)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={tw`mt-10 w-5/6 bg-blue-sysintel-700 ${
                loading ? 'py-6' : ''
              } rounded-md p-2 mx-auto mb-10`}
              disabled={loading}
              onPress={handleRegister}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={tw`text-lg text-center text-white`}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </AlertNotificationRoot>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditarPerfil;
