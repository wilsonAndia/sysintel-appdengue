// src/screens/Welcome.tsx
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Path, Circle } from 'react-native-svg';
import tw from '../../tailwind';
import Navbar from '../components/NavBar';
import { NavigationProp } from '../helpers/types/navigationProp';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const Welcome: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const windowHeight = Dimensions.get('window').height;
  const userRedux = useSelector((state: RootState) => state.auth.user);

  // Data atual formatada em Português
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <Navbar />

      <ScrollView
        contentContainerStyle={tw`flex-grow pb-10 px-6`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`mt-6 mb-2`}>
          <Text
            style={tw`text-blue-sysintel-400 text-sm font-medium uppercase tracking-widest`}
          >
            {today}
          </Text>
        </View>

        <View style={tw`mb-8`}>
          <Text style={tw`text-4xl font-bold text-blue-sysintel-900`}>
            Bem-vindo,
          </Text>
          <Text style={tw`text-3xl font-light text-blue-sysintel-700`}>
            {userRedux?.firstName}
          </Text>
        </View>

        <View
          style={tw`bg-white rounded-2xl p-6 shadow-md border-l-8 border-blue-sysintel-600 mb-8`}
        >
          <View style={tw`items-center mb-6`}>
            <View style={tw`bg-blue-50 p-6 rounded-full mb-4`}>
              <Svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1e40af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <Path d="M9 12l2 2 4-4" />
              </Svg>
            </View>

            <Text
              style={tw`text-xl font-bold text-blue-sysintel-800 text-center mb-2`}
            >
              Combate ao Dengue
            </Text>

            <Text
              style={tw`text-gray-500 text-center text-base leading-6 px-2`}
            >
              "A prevenção é a nossa melhor ferramenta. Seu trabalho em campo
              salva vidas e protege nossa comunidade."
            </Text>
          </View>

          <View style={tw`bg-blue-sysintel-50 rounded-lg p-4`}>
            <Text style={tw`text-blue-sysintel-800 font-bold text-sm mb-1`}>
              Status do Sistema
            </Text>
            <Text style={tw`text-blue-sysintel-600 text-xs`}>
              Conectado e pronto para sincronização.
            </Text>
          </View>
        </View>

        <View style={tw`mb-10 px-2`}>
          <Text style={tw`text-lg font-bold text-gray-700 mb-3`}>
            Diretrizes do dia
          </Text>

          <View style={tw`flex-row items-start mb-4`}>
            <View style={tw`w-2 h-2 rounded-full bg-green-500 mt-2 mr-3`} />
            <Text style={tw`flex-1 text-gray-600 text-base`}>
              Verifique a carga da bateria do dispositivo antes de iniciar as
              rotas longas.
            </Text>
          </View>

          <View style={tw`flex-row items-start`}>
            <View style={tw`w-2 h-2 rounded-full bg-green-500 mt-2 mr-3`} />
            <Text style={tw`flex-1 text-gray-600 text-base`}>
              Registre todas as recusas de visita para atualização estatística.
            </Text>
          </View>
        </View>

        <View style={tw`mt-10 items-center`}>
          <Text style={tw`text-gray-300 text-xs`}>
            SysIntel V.1.0.0 - Combate Endemias
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Welcome;
