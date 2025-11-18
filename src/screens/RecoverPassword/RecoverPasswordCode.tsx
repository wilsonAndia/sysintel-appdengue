import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ALERT_TYPE,
  AlertNotificationRoot,
  Dialog,
  Toast,
} from 'react-native-alert-notification';
import { API_URL } from '@env';

import tw from '../../../tailwind';
import {
  NavigationProp,
  RootStackParamList,
} from '../../helpers/types/navigationProp';

type RecoverPasswordCodeRouteProp = RouteProp<
  RootStackParamList,
  'RecoverPasswordCode'
>;

const RecoverPasswordCode = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RecoverPasswordCodeRouteProp>();
  const { user } = route.params;

  const [timer, setTimer] = useState(60); // Inicializa el temporizador en 60 segundos
  const [isDisabled, setIsDisabled] = useState(true);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Mover el foco al siguiente campo si hay un número
    if (text && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isDisabled) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev === 1) {
            if (interval !== undefined) {
              clearInterval(interval);
            }
            setIsDisabled(false); // Habilita el botón cuando el temporizador llegue a 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    }; // Limpia el intervalo al desmontar el componente
  }, [isDisabled]);

  const handleResend = async () => {
    setLoadingCode(true);
    const response = await axios.post(`${API_URL}users/setCodeResetPassword`, {
      email: user?.email,
    });

    const data = response.data;

    if (data.message === 'Ok') {
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Código reemviado',
        textBody: '',
        autoClose: 500,
        onHide: () => {
          setTimeout(() => {
            setTimer(60); // Reinicia el temporizador
            setIsDisabled(true);
          }, 500); // Ajusta el tiempo según sea necesario
        },
      });
      setLoadingCode(false);
    } else {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: data.message,
      });

      setLoadingCode(false);
    }

    // Deshabilita el botón nuevamente
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async () => {
    setLoading(true);
    let code = otp.join('');
    if (!code) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'O código não pode ficar vazio',
      });
      setLoading(false);
      return;
    }

    if (code.length !== 6) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'O código deve conter exatamente 6 caracteres',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}users/postResetCode/${user.id}`,
        {
          password_reset_code: code,
        },
      );

      const data = response.data;

      if (data.message === 'Ok') {
        /*  */
        setLoading(true);
        navigation.navigate('RecoverPasswordNew', { user });
      } else {
        console.log('erroe');
        setLoading(false);
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: data.message,
        });
      }
      return;
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: `${error.response.data?.message}`,
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={tw`flex-grow`}>
      <AlertNotificationRoot>
        <View style={tw`mt-16`}>
          <Text
            style={tw`text-3xl font-bold mb-4 text-center text-blue-sysintel-700`}
          >
            Recuperar senha
          </Text>
          <Text style={tw` text-base text-blue-sysintel-600 text-center `}>
            {user.firstName} {user.lastName}, por favor insira o código que
            fornecemos para o seu e-mail
          </Text>
        </View>

        <View
          style={tw`mt-5 px-5 w-5/6 mx-auto  gap-2 flex flex-row justify-center items-center`}
        >
          <View>
            <Text style={tw`text-sm text-center text-blue-sysintel-400`}>
              Você não recebeu nenhum código em seu e-mail?
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleResend}
            disabled={isDisabled || loadingCode}
          >
            <View
              style={tw` p-1  rounded-lg ${
                isDisabled ? 'bg-blue-sysintel-100' : 'bg-blue-sysintel-500'
              } `}
            >
              {loadingCode ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={tw`text-xs text-center ${
                    isDisabled
                      ? 'text-blue-sysintel-600'
                      : 'text-blue-sysintel-900'
                  } `}
                >
                  {isDisabled ? `Reenviar em ${timer}s` : 'Reenviar'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-row justify-between px-4 mt-10`}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={tw`border border-blue-sysintel-300 rounded-md text-center text-blue-sysintel-700 text-lg w-12 h-14`}
              value={digit}
              onChangeText={text => handleChangeText(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              ref={ref => {
                inputs.current[index] = ref;
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={tw` px-5   `}
          onPress={handleSendCode}
          disabled={loading}
        >
          <View style={tw` px-5 py-2 rounded-xl bg-blue-sysintel-800 mt-5 `}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw` text-base text-white text-center `}>
                Enviar código
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </AlertNotificationRoot>
    </ScrollView>
  );
};

export default RecoverPasswordCode;
