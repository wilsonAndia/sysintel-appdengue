import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Toast,
} from 'react-native-alert-notification';

import tw from '../../../tailwind';
import {
  NavigationProp,
  RootStackParamList,
} from '../../helpers/types/navigationProp';
import Svg, { Circle, Path } from 'react-native-svg';
import axios from 'axios';
import { setToken, setUser } from '../../redux/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { API_URL } from '@env';

type RecoverPasswordCodeRouteProp = RouteProp<
  RootStackParamList,
  'RecoverPasswordNew'
>;

const RecoverPasswordNew = () => {
  const route = useRoute<RecoverPasswordCodeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = route.params;
  const dispatch = useDispatch();
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [repitPassword, setRepitPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRepitPassword, setShowRepitPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRepitPasswordVisibility = () => {
    setShowRepitPassword(!showRepitPassword);
  };

  const handleNewPassword = async () => {
    setLoading(true);
    if (!nuevoPassword) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'A nova senha não pode ficar vazia',
      });
      setLoading(false);
      return;
    }

    if (!repitPassword) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Você deve repetir sua senha',
      });
      setLoading(false);
      return;
    }

    if (repitPassword !== nuevoPassword) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'As senhas não coincidem',
      });
      setLoading(false);
      return;
    }

    const response = await axios.post(
      `${API_URL}users/updatePasswordByResetCode/${user.id}`,
      {
        newPassword: nuevoPassword,
      },
    );

    const data = response.data;

    if (data.message === 'Ok') {
      const response_login = await axios.post(`${API_URL}users/login`, {
        email: user.email,
        password: nuevoPassword,
      });
      // Aquí puedes manejar la respuesta de la API

      const data_login = response_login.data;
      if (data_login.message === 'Ok') {
        dispatch(setUser(response_login.data.payload.user));
        dispatch(setToken(response_login.data.payload.accessToken));
        await AsyncStorage.setItem(
          'token',
          response_login.data.payload.accessToken,
        );
        setLoading(false);

        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Éxito',
          textBody: data_login.message,
          autoClose: 500,
          onHide: () => {
            setTimeout(() => {
              navigation.navigate('EditarPerfil');
            }, 500); // Ajusta el tiempo según sea necesario
          },
        });
        /*  */
      } else {
        setLoading(false);

        console.log('erroe');
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: data.message,
        });
      }
      return;
    } else {
      console.log('erroe');
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: data.message,
      });
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView contentContainerStyle={tw``}>
        <AlertNotificationRoot>
          <View style={tw`mt-16`}>
            <Text
              style={tw`text-3xl font-bold mb-4 text-center text-blue-sysintel-700`}
            >
              Recuperar senha
            </Text>
            <Text style={tw` text-base text-blue-sysintel-600 text-center `}>
              {user.firstName} {user.lastName}, Por favor digite sua nova senha
            </Text>
          </View>

          <View
            style={tw`flex-col items-start justify-center w-5/6 gap-1 p-2 px-5 mx-auto rounded-md `}
          >
            <View style={tw`flex-row justify-center items-start `}>
              <Text style={tw`text-blue-sysintel-600  `}>Nova senha : </Text>
            </View>
            <View style={tw`flex-1  w-full relative mt-2`}>
              <TextInput
                secureTextEntry={!showPassword}
                style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                value={nuevoPassword}
                onChangeText={text => setNuevoPassword(text)}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={tw`absolute right-2 top-1`}
              >
                {showPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                ) : (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
            style={tw`flex-col justify-center items-start w-5/6 mx-auto gap-1 px-5 rounded-md  p-5 `}
          >
            <View style={tw`flex-row justify-center items-start `}>
              <Text style={tw`text-blue-sysintel-600  `}>
                Repetir Nova senha :{' '}
              </Text>
            </View>
            <View style={tw`flex-1 w-full relative mt-2`}>
              <TextInput
                secureTextEntry={!showRepitPassword}
                style={tw`p-2  border border-blue-sysintel-700 rounded-lg text-blue-sysintel-900`}
                value={repitPassword}
                onChangeText={text => setRepitPassword(text)}
              />

              <TouchableOpacity
                onPress={toggleRepitPasswordVisibility}
                style={tw`absolute right-2  top-1`}
              >
                {showRepitPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                ) : (
                  <Svg
                    style={tw`h-7 w-7 text-blue-sysintel-600`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

          <TouchableOpacity
            disabled={loading}
            style={tw`mt-5 w-5/6 bg-blue-sysintel-700 rounded-md p-2 mx-auto mb-10`}
            onPress={handleNewPassword}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`text-white text-lg text-center`}>
                Atualizar senha
              </Text>
            )}
          </TouchableOpacity>
        </AlertNotificationRoot>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecoverPasswordNew;
