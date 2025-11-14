import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';

import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Dialog,
} from 'react-native-alert-notification';
import axios from 'axios';
import {Circle, Path, Svg} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationProp} from '../../../helpers/types/navigationProp';
import {clearToken} from '../../../redux/authSlice';
import {RootState} from '../../../redux/store';

interface familiar {
  id: string;
  password_actual: string;
  password_nueva: string;
}

const CambiarPassword = () => {
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const [currentUser, setCurrentUser] = useState<familiar>({
    id: '',
    password_actual: '',
    password_nueva: '',
  });
  // const API_URL = 'http://192.168.1.7:3000/api/v1/';
  // const API_URL = 'http://10.0.2.2:3000/api/v1/';

  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [showRepitPassword, setShowRepitPassword] = useState(false);
  const [password_repit, setPassword_repit] = useState('');

  const handleInputChange = (field: keyof familiar, value: string) => {
    setCurrentUser(prevState => ({
      ...prevState,
      [field]: value, // Actualiza el campo correspondiente
    }));
  };

  const handleRegister = async () => {
    // Validación simple para campos vacíos
    if (
      !currentUser.password_actual ||
      !currentUser.password_nueva ||
      !password_repit
    ) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Preencha todos os campos.',
        button: 'Cerrar',
      });
      return;
    }

    if (password_repit !== currentUser.password_nueva) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'As novas senhas não correspondem.',
        button: 'Cerrar',
      });
      return;
    }

    try {
      const response = await axios.put(
        `${process.env.API_URL}users/updatePassword/${userRedux?.id}`,
        {
          currentPassword: currentUser.password_actual,
          newPassword: currentUser.password_nueva,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Aquí puedes manejar la respuesta de la API
      const data = response.data;
      if (data.message === 'Ok') {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Atualização bem-sucedida!',
          textBody:
            'Sua senha foi atualizada. Faça login com seus novos detalhes.',
          autoClose: 500,
          onHide: () => handleLogOut(),
        });
      } else {
        // Mostrar notificación de error
        console.log(data);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: data.message,
          button: 'Cerrar',
        });
      }
      return;
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: `${error.response.data?.message}`,
        button: 'Cerrar',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRepitPasswordVisibility = () => {
    setShowRepitPassword(!showRepitPassword);
  };

  const handleLogOut = async () => {
    await AsyncStorage.removeItem('token');
    dispatch(clearToken());
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <Navbar />
      <ScrollView contentContainerStyle={tw``}>
        <View style={tw`flex mt-24`}>
          <Text
            style={tw`text-xl font-bold text-center text-blue-sysintel-900`}>
            Alterar senha
          </Text>

          <View style={tw`flex-col justify-center items-center mt-1`}>
            <View
              style={tw`flex-col justify-center items-start w-5/6 mx-auto gap-1 px-5 rounded-md  p-5 `}>
              <View style={tw`flex-row justify-center items-start `}>
                <Text style={tw`text-blue-sysintel-800 font-semibold  `}>
                  Digite a senha atual :{' '}
                </Text>
              </View>

              <View style={tw`flex-1  w-full `}>
                <TextInput
                  style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                  value={currentUser.password_actual}
                  onChangeText={text =>
                    handleInputChange('password_actual', text)
                  }
                />
              </View>
            </View>
          </View>

          <View
            style={tw`flex-col justify-center items-start w-5/6 mx-auto gap-1 px-5 rounded-md  p-5 `}>
            <View style={tw`flex-row justify-center items-start `}>
              <Text style={tw`text-blue-sysintel-800 font-semibold  `}>
                Nova senha :{' '}
              </Text>
            </View>
            <View style={tw`flex-1  w-full relative`}>
              <TextInput
                secureTextEntry={!showPassword}
                style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                value={currentUser.password_nueva}
                onChangeText={text => handleInputChange('password_nueva', text)}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={tw`absolute right-2 top-1`}>
                {showPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                ) : (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={tw`flex-col justify-center items-start w-5/6 mx-auto gap-1 px-5 rounded-md  p-5 `}>
            <View style={tw`flex-row justify-center items-start `}>
              <Text style={tw`text-blue-sysintel-800  font-semibold  `}>
                Repetir Nova senha :{' '}
              </Text>
            </View>
            <View style={tw`flex-1  w-full relative`}>
              <TextInput
                secureTextEntry={!showRepitPassword}
                style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                value={password_repit}
                onChangeText={text => setPassword_repit(text)}
              />

              <TouchableOpacity
                onPress={toggleRepitPasswordVisibility}
                style={tw`absolute right-2  top-1`}>
                {showRepitPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                ) : (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <AlertNotificationRoot>
            <TouchableOpacity
              style={tw`mt-10 w-5/6 bg-blue-sysintel-800 rounded-md p-2 mx-auto mb-10`}
              onPress={handleRegister}>
              <Text style={tw`text-white text-lg text-center`}>
                Atualizar senha
              </Text>
            </TouchableOpacity>
          </AlertNotificationRoot>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CambiarPassword;
