import React, { useState } from 'react';
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
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import FastImage from 'react-native-fast-image';
// 🍉 IMPORTACIONES DE WATERMELONDB
import { database } from '../../../database';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import House from '../../../database/models/House';
import Inspection from '../../../database/models/Inspections';
import InspectionMedia from '../../../database/models/InspectionsMedia';

type InspectionRouteProp = RouteProp<RootStackParamList, 'HouseInspections'>;

// =====================================================================
// COMPONENTE 1: LA TARJETA DE LA INSPECCIÓN (Observa sus propias fotos)
// =====================================================================
const RawInspectionCard = ({
  inspection,
  mediaList,
  onOpenMedia,
  navigation,
}: {
  inspection: Inspection;
  mediaList: InspectionMedia[];
  onOpenMedia: (media: InspectionMedia) => void;
  navigation: any;
}) => {
  const isPendingSync = inspection.syncStatus !== 'synced';

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('InspectionDetail', { id: inspection.id })
      }
      style={tw`p-4 mb-4 bg-blue-sysintel-50 rounded-lg shadow-md relative`}
    >
      {isPendingSync && (
        <View
          style={tw`absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full`}
        />
      )}

      <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
        Inspeção em{' '}
        {new Date(inspection.inspectionDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
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
        Detalhes: {inspection.constructionDetails || 'Nenhum'}
      </Text>

      {mediaList.length > 0 && (
        <ScrollView style={tw`mt-2`}>
          {mediaList.map(media => {
            // 🍉 LÓGICA HÍBRIDA DE IMÁGENES
            const isLocal =
              media.url.startsWith('file://') ||
              media.url.startsWith('content://');
            const imageUrl = isLocal
              ? media.url
              : `${API_URL}inspections/getImage/${media.url}`;

            return (
              <View key={media.id} style={tw`flex-row items-center mb-4`}>
                <TouchableOpacity
                  onPress={() => onOpenMedia(media)}
                  style={tw`mr-4`}
                >
                  {media.type === 'image' ? (
                    // 🚀 USAMOS FASTIMAGE AQUÍ
                    <FastImage
                      style={tw`w-32 h-32 rounded-lg`}
                      source={{
                        uri: imageUrl,
                        priority: FastImage.priority.normal,
                        // Le decimos que guarde esta imagen y no la vuelva a pedir a menos que cambie
                        cache: isLocal
                          ? FastImage.cacheControl.web
                          : FastImage.cacheControl.immutable,
                      }}
                      resizeMode={FastImage.resizeMode.cover}
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
                <Text style={tw`text-gray-700 flex-1`}>
                  {media.larvaeDetails}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
};

// 🍉 Enlazamos la inspección con sus fotos (Magia reactiva de Watermelon)
const InspectionCard = withObservables(['inspection'], ({ inspection }) => ({
  inspection,
  mediaList: inspection.media.observe(), // Observa las fotos de esta inspección
}))(RawInspectionCard);

// =====================================================================
// COMPONENTE 2: LA PANTALLA PRINCIPAL
// =====================================================================
const HouseInspectionsUI = ({
  house,
  inspections,
}: {
  house: House;
  inspections: Inspection[];
}) => {
  const navigation = useNavigation<NavigationProp>();
  const inTheArea = useSelector(
    (state: RootState) => state.inTheArea.inTheArea,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InspectionMedia | null>(
    null,
  );
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  // Estados de Edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editResponsible, setEditResponsible] = useState('');
  const [editOwner, setEditOwner] = useState(false);

  // Función Híbrida para ver fotos (Offline y Online)
  const handleOpenMedia = async (media: InspectionMedia) => {
    setModalVisible(true);
    setSelectedMedia(media);
    setMediaLoading(true);

    // Si la foto es local (offline), la mostramos directamente
    if (media.url.startsWith('file://') || media.url.startsWith('content://')) {
      setMediaUrl(media.url);
      setMediaLoading(false);
      return;
    }

    // Si es online, pedimos la URL al servidor como hacías antes
    if (media.type === 'video') {
      try {
        const response = await fetchAxiosToken({
          url: `inspections/getImage/${media.url}`,
          method: 'get',
        });
        setMediaUrl(response.url || '');
      } catch (error) {
        console.error('Error video URL:', error);
      }
    } else {
      setMediaUrl(`${API_URL}inspections/getImage/${media.url}`);
    }
    setMediaLoading(false);
  };

  const openEditModal = () => {
    if (house) {
      setEditResponsible(house.responsible);
      setEditOwner(house.owner);
      setEditModalVisible(true);
    }
  };

  // 🍉 GUARDAR EDICIÓN DE LA CASA DE FORMA OFFLINE
  const handleSaveEdit = async () => {
    try {
      await database.write(async () => {
        await house.update(h => {
          h.responsible = editResponsible;
          h.owner = editOwner;
        });
      });
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Dados atualizados localmente!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar.');
      console.error(error);
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
            onPress={() =>
              navigation.navigate('Inspection', { houseId: house.id })
            }
          >
            <Text style={tw`font-bold text-white`}>+ Nova Inspeção</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RENDERIZADO DE LA LISTA DE INSPECCIONES */}
      {inspections.length === 0 ? (
        <View style={tw`items-center justify-center flex-1`}>
          <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
            Nenhuma inspeção encontrada.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inspections}
          keyExtractor={item => item.id}
          contentContainerStyle={tw`px-4 py-4`}
          renderItem={({ item }) => (
            <InspectionCard
              inspection={item}
              onOpenMedia={handleOpenMedia}
              navigation={navigation}
            />
          )}
        />
      )}

      {/* MODAL DEL VISOR DE MEDIA */}
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

      {/* MODAL DE EDICIÓN DE CASA */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
      >
        {/* Tu mismo código de diseño del modal se queda igual... */}
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
              >
                <Text style={tw`text-gray-700 font-bold`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`px-4 py-2 rounded-lg bg-blue-sysintel-800 flex-row items-center`}
                onPress={handleSaveEdit}
              >
                <Text style={tw`text-white font-bold`}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// =====================================================================
// 🍉 HOC: OBSERVADOR PRINCIPAL (LA MAGIA)
// =====================================================================
const EnhancedHouseInspections = withObservables(
  ['route'],
  ({ route }: any) => {
    const houseId = route.params.id;
    return {
      // 1. Observamos la casa específica
      house: database.get<House>('houses').findAndObserve(houseId),
      // 2. Observamos todas las inspecciones que le pertenecen a esta casa
      inspections: database.collections
        .get<Inspection>('inspections')
        .query(
          Q.where('house_id', houseId),
          Q.sortBy('inspection_date', Q.desc), // Las ordenamos de la más nueva a la más vieja
        )
        .observe(),
    };
  },
)(HouseInspectionsUI);

export default EnhancedHouseInspections;
