import React, { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  FlatList,
  ScrollView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  NavigationProp,
  RootStackParamList,
} from '../../../helpers/types/navigationProp';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import Video from 'react-native-video';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { API_URL } from '@env';

type InspectionRouteProp = RouteProp<RootStackParamList, 'HouseInspections'>;

interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  larvaeDetails: string;
}

interface Inspection {
  id: string;
  numberOfAdults: number;
  numberOfChildren: number;
  someoneAtHome: boolean;
  underConstruction: boolean;
  constructionDetails: string;
  hasDengueFoci: boolean;
  inspectionDate: string;
  media: Media[];
}

interface House {
  id: string;
  neighborhood: string;
  street: string;
  number: string;
  responsible: string;
  inspections: Inspection[];
  owner: boolean;
}

const HouseInspections = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InspectionRouteProp>();
  const { id } = route.params;
  const zone = useSelector((state: RootState) => state.zones.selectedZone);
  const userRedux = useSelector((state: RootState) => state.auth.user);

  const inTheArea = useSelector(
    (state: RootState) => state.inTheArea.inTheArea,
  );
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editResponsible, setEditResponsible] = useState('');
  const [editOwner, setEditOwner] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const getInspections = async () => {
    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `inspections/house/${id}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setHouse(response.payload);
      } else {
        Alert.alert('Erro', 'Falha ao obter inspeções');
      }
    } catch (error) {
      console.log('Erro:', error);
      Alert.alert('Erro', 'Houve um problema ao obter inspeções');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMedia = async (media: Media) => {
    setModalVisible(true);
    setSelectedMedia(media);
    setMediaLoading(true);

    const url = await getMediaUrl(media);
    setMediaUrl(url);

    setMediaLoading(false);
  };

  const openEditModal = () => {
    if (house) {
      setEditResponsible(house.responsible);
      setEditOwner(house.owner);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const response = await fetchAxiosToken({
        url: `inspections/house/edit/${id}`,
        method: 'post',
        body: {
          responsible: editResponsible,
          owner: editOwner,
        },
        subdomain: userRedux?.subdomain,
      });
      console.log('Resposta da edição:', response);
      if (response.statusCode === 200 || response.id) {
        setHouse(prevHouse =>
          prevHouse
            ? { ...prevHouse, responsible: editResponsible, owner: editOwner }
            : prevHouse,
        );
        setEditModalVisible(false);
        Alert.alert('Sucesso', 'Dados da casa atualizados com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao atualizar os dados');
      }
    } catch (error) {
      console.log('Erro ao editar casa:', error);
      Alert.alert('Erro', 'Houve um problema ao salvar as edições');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    getInspections();
  }, []);

  const getMediaUrl = async (media: Media): Promise<string> => {
    if (media.type === 'video') {
      try {
        const response = await fetchAxiosToken({
          url: `inspections/getImage/${media.url}`,
          method: 'get',
        });

        if (response.url) {
          return response.url;
        } else {
          console.warn('No se pudo obtener pre-signed URL del video');
          return '';
        }
      } catch (error) {
        console.error('Error al obtener pre-signed URL del video:', error);
        return '';
      }
    } else {
      return `${API_URL}inspections/getImage/${media.url}`;
    }
  };

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <View style={tw`px-4 mt-10`}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>
      <View style={tw`flex-row items-center justify-between px-4 mt-4`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={tw`text-xl font-bold text-blue-sysintel-800`}>
            Inspeções da Casa
          </Text>
          <Text style={tw`text-lg text-blue-sysintel-900`}>
            {house?.street} - {house?.number}
          </Text>

          <View style={tw`flex-row items-center mt-1`}>
            <Text style={tw`text-blue-sysintel-600`}>
              Responsável: {house?.responsible}
            </Text>

            {/* Botón de Edición (Ícono SVG) */}
            <TouchableOpacity onPress={openEditModal} style={tw`ml-2`}>
              <Svg
                style={tw`h-5 w-5 text-blue-sysintel-600`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-blue-sysintel-600 mt-1`}>
            É o dono: {house?.owner ? 'Sim' : 'Não'}
          </Text>
        </View>
        <View style={tw`flex-col items-center gap-2`}>
          <TouchableOpacity
            style={tw.style(
              'px-4 py-2 rounded-lg',
              inTheArea ? 'bg-blue-sysintel-800' : 'bg-blue-sysintel-200',
            )}
            onPress={() => {
              // if (!inTheArea) {
              //   Alert.alert(
              //     'Atenção',
              //     'Você deve estar dentro da zona para iniciar uma nova inspeção.',
              //   );
              //   return;
              // }
              navigation.navigate('Inspection', { houseId: id });
            }}
          >
            <Text style={tw`font-bold text-white`}>+ Nova Inspeção</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw.style(
              'flex justify-center py-2 rounded-lg px-7',
              inTheArea ? 'bg-blue-sysintel-800' : 'bg-blue-sysintel-200',
            )}
            onPress={() => {
              if (!inTheArea) {
                Alert.alert(
                  'Atenção',
                  'Você deve estar dentro da zona para acessar as observações.',
                );
                return;
              }
              navigation.navigate('Observations', { houseId: id });
            }}
          >
            <Text style={tw`mx-auto font-bold text-white`}>Observações</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={tw`items-center justify-center flex-1`}>
          <ActivityIndicator size="large" color="#17375e" />
          <Text style={tw`mt-2 text-blue-sysintel-800`}>
            Carregando inspeções...
          </Text>
        </View>
      ) : house?.inspections.length === 0 ? (
        <View style={tw`items-center justify-center flex-1`}>
          <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
            Nenhuma inspeção encontrada.
          </Text>
        </View>
      ) : (
        <FlatList
          data={house?.inspections}
          keyExtractor={inspection => inspection.id}
          contentContainerStyle={tw`px-4 py-4`}
          renderItem={({ item: inspection }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('InspectionDetail', { id: inspection.id })
              }
              style={tw`p-4 mb-4 bg-blue-sysintel-50 rounded-lg shadow-md`}
            >
              <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
                Inspeção em{' '}
                {new Date(inspection.inspectionDate).toLocaleDateString(
                  'es-ES',
                  { day: '2-digit', month: '2-digit', year: 'numeric' },
                )}
              </Text>
              <Text style={tw`text-blue-sysintel-800`}>
                Alguém em casa: {inspection.someoneAtHome ? 'Sim' : 'Não'}
              </Text>
              <Text style={tw`text-blue-sysintel-800`}>
                Adultos: {inspection.numberOfAdults}
              </Text>
              <Text style={tw`text-blue-sysintel-800`}>
                Crianças: {inspection.numberOfChildren}
              </Text>
              <Text style={tw`text-blue-sysintel-800`}>
                Criadouros: {inspection.hasDengueFoci ? 'Sim' : 'Não'}
              </Text>
              <Text style={tw`text-blue-sysintel-800`}>
                Detalhes: {inspection.constructionDetails}
              </Text>

              {inspection.media.length > 0 && (
                <ScrollView>
                  {inspection?.media.map(media => (
                    <View key={media.id} style={tw`flex-row items-center mb-4`}>
                      <TouchableOpacity
                        onPress={() => handleOpenMedia(media)}
                        style={tw`mr-4`}
                      >
                        {media.type === 'image' ? (
                          <Image
                            source={{
                              uri: `${API_URL}inspections/getImage/${media.url}`,
                            }}
                            style={tw`w-32 h-32 rounded-lg`}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={tw`items-center justify-center w-32 h-32 bg-black rounded-lg`}
                          >
                            <Text style={tw`text-sm text-white`}>
                              Assista ao vídeo
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={tw`text-gray-700 `}>
                        {media.larvaeDetails}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      (
      <Modal visible={modalVisible} transparent={true}>
        <View style={tw`items-center justify-center flex-1 bg-black`}>
          {mediaLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : selectedMedia?.type === 'image' ? (
            <Image
              source={{ uri: mediaUrl }}
              style={tw`w-full h-full`}
              resizeMode="contain"
            />
          ) : selectedMedia?.type === 'video' ? (
            <Video
              source={{ uri: mediaUrl }}
              style={tw`w-full h-full`}
              resizeMode="contain"
              controls={true}
            />
          ) : null}
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setSelectedMedia(null);
              setMediaUrl('');
            }}
            style={tw`absolute p-2 bg-red-500 rounded-full top-10 right-10`}
          >
            <Text style={tw`text-white`}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Nuevo Modal para Editar Casa */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/50 px-4`}>
          <View style={tw`bg-white w-full rounded-xl p-6 shadow-lg`}>
            <Text style={tw`text-xl font-bold text-blue-sysintel-900 mb-4`}>
              Editar Dados da Casa
            </Text>

            <Text style={tw`text-blue-sysintel-800 font-semibold mb-1`}>
              Responsável
            </Text>
            <TextInput
              style={tw`border border-gray-300 rounded-lg p-3 mb-4 text-black`}
              value={editResponsible}
              onChangeText={setEditResponsible}
              placeholder="Nome do responsável"
              placeholderTextColor="#9ca3af"
            />

            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-blue-sysintel-800 font-semibold`}>
                É o dono da casa?
              </Text>
              <Switch
                value={editOwner}
                onValueChange={setEditOwner}
                trackColor={{ false: '#d1d5db', true: '#17375e' }}
                thumbColor={editOwner ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={tw`flex-row justify-end gap-3`}>
              <TouchableOpacity
                style={tw`px-4 py-2 rounded-lg bg-gray-200`}
                onPress={() => setEditModalVisible(false)}
                disabled={savingEdit}
              >
                <Text style={tw`text-gray-700 font-bold`}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`px-4 py-2 rounded-lg bg-blue-sysintel-800 flex-row items-center`}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={tw`mr-2`}
                  />
                ) : null}
                <Text style={tw`text-white font-bold`}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )
    </SafeAreaView>
  );
};

export default HouseInspections;
