import React, {useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import tw from '../../tailwind';
import {RootState} from '../redux/store';
import Svg, {Circle, Path} from 'react-native-svg';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../helpers/types/navigationProp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearToken, setUser} from '../redux/authSlice';

const FirstLogint = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const userRedux = useSelector((state: RootState) => state.auth.user);

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
      `${process.env.API_URL}users/updatePasswordByResetCode/${userRedux?.id}`,
      {
        newPassword: nuevoPassword,
      },
    );

    const data = response.data;

    if (data.message === 'Ok') {
      // Aquí puedes manejar la respuesta de la API
      dispatch(setUser(response.data.payload));
      setLoading(false);
      console.log('Ok');
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Éxito',
        textBody: 'Senha atualizada',
        autoClose: 500,
        onHide: () => {
          setTimeout(() => {
            navigation.navigate('EditarPerfil');
          }, 500); // Ajusta el tiempo según sea necesario
        },
      });
    } else {
      console.log('erroe');
      setLoading(false);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: data.message,
      });
    }
  };

  const handleLogin = async () => {
    try {
      await AsyncStorage.removeItem('token');
      dispatch(clearToken()); // Remueve el token del almacenamiento

      navigation.navigate('Login'); // Redirige a la pantalla de login
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
      // Opcional: Mostrar una notificación en caso de error
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <AlertNotificationRoot>
          <View style={tw`mt-16`}>
            <Text style={tw`mb-4 text-3xl font-bold text-center text-gray-700`}>
              Primeiro login
            </Text>
            <Text style={tw`text-base text-center text-gray-600 `}>
              {userRedux?.firstName} {userRedux?.lastName}, Por favor, como você
              ainda tem a senha padrão atribuída a você, convidamos você a
              alterar sua senha
            </Text>
          </View>

          <View
            style={tw`flex-col items-start justify-center w-5/6 gap-1 p-5 px-5 mx-auto rounded-md `}>
            <View style={tw`flex-row items-start justify-center `}>
              <Text style={tw`text-[#17375e]  `}>Nova senha : </Text>
            </View>
            <View style={tw`flex-1 border-b border-[#17375e] w-full relative`}>
              <TextInput
                secureTextEntry={!showPassword}
                style={tw`p-0`}
                value={nuevoPassword}
                onChangeText={text => setNuevoPassword(text)}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={tw`absolute right-2 -top-3`}>
                {showPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-[#17375e]`}
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
                    style={tw`h-7 w-7 text-[#17375e]`}
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
            style={tw`flex-col items-start justify-center w-5/6 gap-1 p-5 px-5 mx-auto rounded-md `}>
            <View style={tw`flex-row items-start justify-center `}>
              <Text style={tw`text-[#17375e]  `}>Repetir Nova senha : </Text>
            </View>
            <View style={tw`flex-1 border-b border-[#17375e] w-full relative`}>
              <TextInput
                secureTextEntry={!showRepitPassword}
                style={tw`p-0`}
                value={repitPassword}
                onChangeText={text => setRepitPassword(text)}
              />

              <TouchableOpacity
                onPress={toggleRepitPasswordVisibility}
                style={tw`absolute right-2 -top-3`}>
                {showRepitPassword ? (
                  <Svg
                    style={tw`h-7 w-7 text-[#17375e]`}
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
                    style={tw`h-7 w-7 text-[#17375e]`}
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

          <TouchableOpacity
            disabled={loading}
            style={tw`mt-10 w-5/6 bg-[#17375e] rounded-md p-2 mx-auto mb-10`}
            onPress={handleNewPassword}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`text-lg text-center text-white`}>
                Atualizar senha
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleLogin()}>
            <Text
              style={tw`mt-10 text-base text-center text-blue-500 underline `}>
              Voltar ao login
            </Text>
          </TouchableOpacity>
        </AlertNotificationRoot>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FirstLogint;
