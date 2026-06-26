import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import Video from 'react-native-video';
import { API_URL } from '@env';
import { database } from '../../../database';
import InspectionWM from '../../../database/models/Inspections';

type InspectionDetailRouteProp = RouteProp<
  { InspectionDetail: { id: string } },
  'InspectionDetail'
>;

interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  larvaeDetails: string;
}

interface House {
  id: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  latitude: string;
  longitude: string;
  responsible: string;
}

interface Inspection {
  id: string;
  numberOfAdults: number;
  numberOfChildren: number;
  underConstruction: boolean;
  constructionDetails?: string;
  someoneAtHome: boolean;
  latitude: string;
  longitude: string;
  startTime: string;
  endTime: string;
  buildingCharacteristics: string[];
  hasPets: boolean;
  petTypes: string[];
  hasPool: boolean;
  poolCondition: string[];
  neighborCharacteristics: Record<string, string>;
  hasDengueFoci: boolean;
  inspectionDate: string;
  house: House;
  media: Media[];
}

const InspectionDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<InspectionDetailRouteProp>();
  const { id } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  const getInspectionDetail = async () => {
    setLoading(true);
    let apiSuccess = false;
    try {
      const response = await fetchAxiosToken({
        url: `inspections/get-one/${id}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setInspection(response.payload);
        apiSuccess = true;
      } else {
        console.log('Erro:', response.message);
      }
    } catch (error) {
      console.log('Erro API (offline?):', error);
    }

    if (!apiSuccess) {
      try {
        const localInspection = await database.get<InspectionWM>('inspections').find(id);
        const localHouse: any = await localInspection.house.fetch();
        const localPets = await localInspection.pets.fetch();
        const localPoolConditions = await localInspection.poolConditions.fetch();
        const localBuildingChars = await localInspection.buildingCharacteristics.fetch();
        const localMedia = await localInspection.media.fetch();

        const mappedInspection: Inspection = {
          id: localInspection.id,
          numberOfAdults: localInspection.numberOfAdults,
          numberOfChildren: localInspection.numberOfChildren,
          underConstruction: localInspection.underConstruction,
          constructionDetails: localInspection.constructionDetails || '',
          someoneAtHome: localInspection.someoneAtHome,
          latitude: String(localInspection.latitude),
          longitude: String(localInspection.longitude),
          startTime: localInspection.startTime ? localInspection.startTime.toISOString() : '',
          endTime: localInspection.endTime ? localInspection.endTime.toISOString() : '',
          hasPets: localInspection.hasPets,
          petTypes: localPets.map((p: any) => p.petTypeId), // Guardado como ID offline
          hasPool: localInspection.hasPool,
          poolCondition: localPoolConditions.map((pc: any) => pc.poolConditionTypeId), // Guardado como ID offline
          buildingCharacteristics: localBuildingChars.map((bc: any) => bc.buildingCharacteristicTypeId), // Guardado como ID offline
          neighborCharacteristics: {
            neighbor1: localInspection.neighbor1 || '',
            neighbor2: localInspection.neighbor2 || '',
            neighbor3: localInspection.neighbor3 || '',
          },
          hasDengueFoci: localInspection.hasDengueFoci,
          inspectionDate: localInspection.inspectionDate.toISOString(),
          house: {
            id: localHouse.id,
            neighborhood: localHouse.neighborhood,
            street: localHouse.street,
            number: localHouse.number,
            complement: localHouse.complement || '',
            latitude: String(localHouse.latitude),
            longitude: String(localHouse.longitude),
            responsible: localHouse.responsible,
          },
          media: localMedia.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.type as 'image' | 'video',
            larvaeDetails: m.larvaeDetails,
          }))
        };

        setInspection(mappedInspection);
      } catch (dbError) {
        console.log('Error buscando en BD local:', dbError);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    getInspectionDetail();
  }, []);

  const getMediaUrl = async (media: Media): Promise<string> => {
    // Si la foto es local (offline), la mostramos directamente
    if (media.url.startsWith('file://') || media.url.startsWith('content://')) {
      return media.url;
    }

    if (media.type === 'video') {
      try {
        const response = await fetchAxiosToken({
          url: `inspections/getImage/${media.url}`,
          method: 'get',
        });

        if (response.url) {
          return response.url;
        } else {
          console.warn('No se pudo obtener pre-signed URL del video.');
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

  const handleOpenMedia = async (media: Media) => {
    setModalVisible(true);
    setSelectedMedia(media);
    setMediaLoading(true);

    const url = await getMediaUrl(media);
    setMediaUrl(url);

    setMediaLoading(false);
  };

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <View style={tw`px-4 mt-10 `}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      {loading ? (
        <View style={tw`items-center justify-center flex-1`}>
          <ActivityIndicator size="large" color="#17375e" />
          <Text style={tw`mt-2 text-blue-sysintel-600`}>
            Carregando inspeção...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`p-4`}>
          <Text style={tw`text-xl font-bold text-blue-sysintel-800`}>
            Detalhes da Inspeção
          </Text>
          <Text style={tw`text-lg text-blue-sysintel-900`}>
            Casa: {inspection?.house.street} {inspection?.house.number},{' '}
            {inspection?.house.neighborhood}
          </Text>
          <Text style={tw`text-blue-sysintel-700`}>
            Responsável: {inspection?.house.responsible}
          </Text>

          <View style={tw`p-4 mt-4 bg-blue-sysintel-100 rounded-lg shadow-md`}>
            <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
              Inspeção em{' '}
              {new Date(inspection?.inspectionDate || '').toLocaleDateString(
                'es-ES',
                {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                },
              )}
            </Text>
            <Text style={tw`text-blue-sysintel-800`}>
              Adultos: {inspection?.numberOfAdults}
            </Text>
            <Text style={tw`text-blue-sysintel-800`}>
              Crianças: {inspection?.numberOfChildren}
            </Text>
            <Text style={tw`text-blue-sysintel-800`}>
              Em construção: {inspection?.underConstruction ? 'Sim' : 'Não'}
            </Text>
            {inspection?.constructionDetails && (
              <Text style={tw`text-blue-sysintel-800`}>
                Detalhes da Construção: {inspection.constructionDetails}
              </Text>
            )}
            <Text style={tw`text-blue-sysintel-800`}>
              Alguém em casa: {inspection?.someoneAtHome ? 'Sim' : 'Não'}
            </Text>

            <Text style={tw`text-blue-sysintel-800`}>
              Animais de estimação: {inspection?.hasPets ? 'Sim' : 'Não'}
            </Text>
            {inspection?.hasPets && inspection.petTypes && inspection.petTypes.length > 0 && (
              <Text style={tw`text-blue-sysintel-800`}>
                Tipos de animais: {inspection.petTypes.join(', ')}
              </Text>
            )}

            <Text style={tw`text-blue-sysintel-800`}>
              Piscina: {inspection?.hasPool ? 'Sim' : 'Não'}
            </Text>
            {inspection?.hasPool && inspection.poolCondition && inspection.poolCondition.length > 0 && (
              <Text style={tw`text-blue-sysintel-800`}>
                Condição da piscina: {inspection.poolCondition.join(', ')}
              </Text>
            )}

            {inspection?.buildingCharacteristics && inspection.buildingCharacteristics.length > 0 && (
              <Text style={tw`text-blue-sysintel-800 mt-2`}>
                Características do imóvel: {inspection.buildingCharacteristics.join(', ')}
              </Text>
            )}

            <Text style={tw`mt-4 text-lg font-bold text-blue-sysintel-900`}>
              Características dos vizinhos
            </Text>
            {inspection?.neighborCharacteristics &&
              (() => {
                try {
                  return Object.entries(inspection.neighborCharacteristics).map(
                    ([key, value], index) => (
                      <Text key={index} style={tw`text-blue-sysintel-800`}>
                        {`Vizinho  ${
                          index + 1 === 1
                            ? ' (esquerda)'
                            : index + 1 === 2
                            ? ' (de trás)'
                            : ' (direita)'
                        }: ${value}`}
                      </Text>
                    ),
                  );
                } catch (error) {
                  console.error(
                    'Erro ao analisar neighborCharacteristics:',
                    error,
                  );
                  return null;
                }
              })()}
            <Text style={tw`mt-4 text-lg font-bold text-blue-sysintel-900`}>
              Observações
            </Text>
            <Text style={tw`text-blue-sysintel-800`}>
              Possui focos de dengue:{' '}
              {inspection?.hasDengueFoci ? 'Sim' : 'Não'}
            </Text>
          </View>
          {inspection?.media.length ? (
            <>
              <Text style={tw`mt-4 text-lg font-bold text-blue-sysintel-800`}>
                Mídia
              </Text>
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
                            uri:
                              media.url.startsWith('file://') || media.url.startsWith('content://')
                                ? media.url
                                : `${API_URL}inspections/getImage/${media.url}`,
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
                    <Text style={tw`text-blue-sysintel-800 `}>
                      {media.larvaeDetails}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
        </ScrollView>
      )}
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
    </SafeAreaView>
  );
};

export default InspectionDetail;
