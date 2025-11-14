import React, {useEffect, useState} from 'react';
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
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {ButtonRegresar} from '../../../helpers/ButtonRegresar';
import Video from 'react-native-video';

type InspectionDetailRouteProp = RouteProp<
  {InspectionDetail: {id: string}},
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
  const {id} = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  const getInspectionDetail = async () => {
    setLoading(true);
    try {
      const response = await fetchAxiosToken({
        url: `inspections/get-one/${id}`,
        method: 'get',
      });

      if (response.statusCode === 200) {
        setInspection(response.payload);
      } else {
        console.log('Erro:', response.message);
      }
    } catch (error) {
      console.log('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInspectionDetail();
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
      return `${process.env.API_URL}inspections/getImage/${media.url}`;
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
                      style={tw`mr-4`}>
                      {media.type === 'image' ? (
                        <Image
                          source={{
                            uri: `${process.env.API_URL}inspections/getImage/${media.url}`,
                          }}
                          style={tw`w-32 h-32 rounded-lg`}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={tw`items-center justify-center w-32 h-32 bg-black rounded-lg`}>
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
              source={{uri: mediaUrl}}
              style={tw`w-full h-full`}
              resizeMode="contain"
            />
          ) : selectedMedia?.type === 'video' ? (
            <Video
              source={{uri: mediaUrl}}
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
            style={tw`absolute p-2 bg-red-500 rounded-full top-10 right-10`}>
            <Text style={tw`text-white`}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default InspectionDetail;
