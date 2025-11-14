import React, {useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Dialog,
  Toast,
} from 'react-native-alert-notification';

import Svg, {Path, Polyline} from 'react-native-svg';
import tw from '../../../tailwind';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../helpers/types/navigationProp';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const RecoverPasswordEmail = () => {
  const [correo, setCorreo] = useState('');

  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(false);

  const handleSendCodeResetPassword = async () => {
    setLoading(true);
    if (!correo) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'O e-mail não pode ficar vazio',
      });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Digite um endereço de e-mail válido.',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.API_URL}users/setCodeResetPassword`,
        {
          email: correo.trim().toLowerCase(),
        },
      );

      const data = response.data;

      if (data.message === 'Ok') {
        /*  */
        const user: User = {
          id: data.payload.id,
          firstName: data.payload.firstName,
          lastName: data.payload.lastName,
          email: data.payload.email,
        };
        setLoading(false);
        navigation.navigate('RecoverPasswordCode', {user});
      } else {
        console.log('erroe');
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: data.message,
        });
        setLoading(false);
      }
      return;
    } catch (error: any) {
      console.log(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: `${error.response.data?.message}`,
      });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <AlertNotificationRoot>
          <View style={tw`mt-16`}>
            <Text
              style={tw`mb-4 text-3xl font-bold text-center text-blue-sysintel-700`}>
              Recuperar senha
            </Text>
            <Text style={tw`text-base text-center  text-blue-sysintel-600`}>
              Por favor insira seu e-mail
            </Text>
            <View
              style={tw`flex-row items-center justify-start w-full gap-4 px-5 mt-5`}>
              <Svg
                style={tw`h-7 w-7 text-blue-sysintel-600`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <Polyline points="22,6 12,13 2,6" />
              </Svg>
              <View style={tw`flex-1 border-b border-blue-sysintel-600`}>
                <TextInput
                  placeholder="E-mail"
                  style={tw`p-2 text-base text-blue-sysintel-700 placeholder:text-blue-sysintel-500`}
                  value={correo}
                  onChangeText={text => setCorreo(text)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={tw`px-5 mt-3 `}
              onPress={handleSendCodeResetPassword}
              disabled={loading}>
              <View style={tw`px-5 py-2 mt-3  rounded-xl bg-blue-sysintel-800`}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    style={tw`text-base text-center  text-blue-sysintel-100`}>
                    Seguindo
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text
                style={tw`mt-5 text-base text-center underline  text-blue-sysintel-500`}>
                Voltar ao login
              </Text>
            </TouchableOpacity>
          </View>
        </AlertNotificationRoot>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecoverPasswordEmail;
