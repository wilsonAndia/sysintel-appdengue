// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { NavigationProp } from '../helpers/types/navigationProp';
import tw from '../../tailwind';
import { API_URL } from '@env';

import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Dialog,
  Toast,
} from 'react-native-alert-notification';
import axios from 'axios';
import { Svg, Path, Rect, Circle, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setToken, setUser } from '../redux/authSlice';

interface input {
  correo: string;
  password: string;
}

const Login: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState<input>({
    correo: '',
    password: '',
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (field: keyof input, value: string) => {
    setInput(prevState => ({
      ...prevState,
      [field]: value, // Actualiza el campo correspondiente
    }));
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!input.correo || !input.password) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.correo.trim())) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Digite um endereço de e-mail válido.',
      });
      return;
    }

    setLoading(true);

    try {
      console.log(`${API_URL}user/loginAppp`);
      const response = await axios.post(`${API_URL}users/loginApp`, {
        email: input.correo.trim().toLowerCase(),
        password: input.password,
      });

      const data = response.data;
      console.log('data', data);
      if (data.message === 'Ok') {
        const { accessToken, user } = data.payload;
        dispatch(setUser(user));
        dispatch(setToken(accessToken));
        await AsyncStorage.setItem('token', accessToken);
        setLoading(false);
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Sucesso',
          textBody: 'Bem-vindo ao SysIntel',
          autoClose: 800,
          onHide: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        });
      } else {
        console.log('error controlado');
        setLoading(false);
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody:
            data.errors?.[0]?.constraints?.message || 'Error desconocido',
        });
      }
    } catch (error: any) {
      // Solo errores de red u otros imprevistos
      setLoading(false);
      console.log('error en catch', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Ocurrió un error inesperado',
      });
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={tw`flex-grow`}
      >
        <AlertNotificationRoot>
          <View style={tw`mt-5`}>
            <Image
              source={require('../assets/logo_sysintel.jpg')}
              style={tw`w-46 mx-auto h-46 border-2 border-blue-sysintel-600 rounded-lg mb-4`}
            />
            <Text
              style={tw`mb-4 text-3xl font-bold text-center text-blue-sysintel-700 `}
            >
              Login
            </Text>
            <View
              style={tw`flex-row items-center justify-start w-full gap-4 px-5`}
            >
              <Svg
                style={tw`h-7 w-7 text-blue-sysintel-600`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <Polyline points="22,6 12,13 2,6" />
              </Svg>
              <View style={tw`flex-1 border-b border-blue-sysintel-600`}>
                <TextInput
                  placeholder="E-mail"
                  // style={tw`p-1`}
                  value={input.correo}
                  onChangeText={text => handleInputChange('correo', text)}
                  style={tw`p-2 text-base text-blue-sysintel-900 placeholder:text-blue-sysintel-500`}
                />
              </View>
            </View>

            <View
              style={tw`flex-row items-center justify-start w-full gap-4 px-5 mt-3`}
            >
              <Svg
                style={tw`h-7 w-7 text-blue-sysintel-600`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </Svg>
              <View
                style={tw`flex-1 border-b border-blue-sysintel-600 relative`}
              >
                <TextInput
                  placeholder="Senha"
                  secureTextEntry={!showPassword}
                  value={input.password}
                  onChangeText={text => handleInputChange('password', text)}
                  style={tw`p-2 text-base text-blue-sysintel-900 placeholder:text-blue-sysintel-500`}
                />

                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={tw`absolute right-2 top-3`}
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

            <TouchableOpacity
              style={tw`mt-10 w-4/5 bg-blue-sysintel-800 rounded-md p-2 ${loading ? 'py-3' : ''
                } mx-auto flex`}
              disabled={loading}
              onPress={handleRegister}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={tw`text-lg text-center text-white`}>Acessar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('RecoverPasswordEmail')}
            >
              <Text
                style={tw`mt-5 text-base text-center text-blue-sysintel-400 underline`}
              >
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>
          </View>
        </AlertNotificationRoot>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
