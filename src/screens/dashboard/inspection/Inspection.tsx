import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import tw from '../../../../tailwind';
import * as ImagePicker from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import Navbar from '../../../components/NavBar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '../../../helpers/types/navigationProp';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import Video from 'react-native-video';
import ImageViewer from 'react-native-image-viewing';
import ToggleButton from '../../../helpers/ToggleButton';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { API_URL } from '@env';

import { hasInternet } from '../../../helpers/checkConnection';
import {
  saveFullInspection,
  saveNoOneAtHomeInspection,
} from '../../../database/services/inspectionService';
type InspectionRouteProp = RouteProp<
  { Inspection: { houseId: string } },
  'Inspection'
>;

interface MediaFile {
  uri: string;
  type: string;
  name: string;
  larvaeDetails: string;
  latitude: number;
  longitude: number;
}

interface InspectionData {
  houseId: string;
  numberOfAdults: string;
  numberOfChildren: string;
  underConstruction: boolean;
  constructionDetails: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  hasDengueFoci: boolean;
  mediaFiles: MediaFile[];
}

const Inspection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InspectionRouteProp>();
  const { houseId } = route.params;
  const selectedZoneRedux = useSelector(
    (state: RootState) => state.zones.selectedZone,
  );

  // Usuario actual para obtener el subdomain
  const userRedux = useSelector((state: RootState) => state.auth.user);

  const [numberOfAdults, setNumberOfAdults] = useState<string>('');
  const [numberOfChildren, setNumberOfChildren] = useState<string>('');
  const [underConstruction, setUnderConstruction] = useState<boolean>(false);
  const [constructionDetails, setConstructionDetails] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [hasDengueFoci, setHasDengueFoci] = useState<boolean>(false);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [petTypes, setPetTypes] = useState<string[]>([]);
  const [hasPool, setHasPool] = useState<boolean>(false);
  const [poolCondition, setPoolCondition] = useState<string[]>([]);

  const [inspectionStarted, setInspectionStarted] = useState<boolean>(false);

  const [buildingCharacteristics, setBuildingCharacteristics] = useState<
    string[]
  >([]);
  const [neighborCharacteristics, setNeighborCharacteristics] = useState<any>({
    neighbor1: '',
    neighbor2: '',
    neighbor3: '',
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewModal, setPreviewModal] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [tempLarvaeDetails, setTempLarvaeDetails] = useState<string>('');

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(
    null,
  );

  const { width, height } = useWindowDimensions();

  const getLocation = async () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      error => console.log('Error Location:', error),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 },
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  // =======================================================
  // 1. INICIAR INSPECCIÓN (HÍBRIDO)
  // =======================================================
  const startInspection = async () => {
    if (!latitude || !longitude) {
      await getLocation();
    }
    setStartTime(new Date().toISOString());
    setInspectionStarted(true);
  };

  // =======================================================
  // 2. NO HAY NADIE (HÍBRIDO)
  // =======================================================
  const noOneAtHome = async () => {
    if (!latitude || !longitude) {
      await getLocation();
    }
    setLoading(true);

    try {
      // 🍉 Llamamos al servicio limpio
      await saveNoOneAtHomeInspection(
        houseId,
        userRedux,
        selectedZoneRedux,
        latitude || 0,
        longitude || 0,
        startTime,
      );

      Alert.alert('Sucesso', 'Visita registrada (Não havia ninguém)');
      navigation.goBack();
    } catch (error) {
      console.error('Error noOneAtHome:', error);
      Alert.alert('Erro', 'Não foi possível guardar localmente.');
    } finally {
      setLoading(false);
    }
  };
  // =======================================================
  // 3. FINALIZAR INSPECCIÓN
  // =======================================================
  const sendInspection = async (someoneAtHome: boolean) => {
    if (!inspectionStarted) return;
    setLoading(true);

    try {
      // Empaquetamos todo el estado para enviarlo al servicio
      const inspectionData = {
        numberOfAdults,
        numberOfChildren,
        underConstruction,
        constructionDetails,
        someoneAtHome,
        latitude,
        longitude,
        startTime,
        hasPets,
        hasPool,
        hasDengueFoci,
        neighborCharacteristics,
        petTypes,
        poolCondition,
        buildingCharacteristics,
        mediaFiles,
      };

      // 🍉 Llamamos al servicio limpio
      await saveFullInspection(
        houseId,
        userRedux,
        selectedZoneRedux,
        inspectionData,
      );

      Alert.alert(
        'Sucesso',
        'Inspeção guardada localmente. Será sincronizada automaticamente.',
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error sendInspection:', error);
      Alert.alert('Erro', 'Houve um problema ao guardar localmente.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de Cámara y UI se mantienen igual
  const openCamera = async (mediaType: 'photo' | 'video') => {
    try {
      const options: CameraOptions = {
        mediaType: mediaType,
        cameraType: 'back',
        quality: 0.8,
      };

      const response = await launchCamera(options);

      if (response.assets && response.assets.length > 0) {
        const file = response.assets[0];

        await new Promise<void>((resolve, reject) => {
          Geolocation.getCurrentPosition(
            position => {
              const { latitude, longitude } = position.coords;

              setPreviewFile({
                uri: file.uri!,
                type: file.type!,
                name: file.fileName || `file_${Date.now()}`,
                larvaeDetails: '',
                latitude,
                longitude,
              });

              setPreviewModal(true);
              resolve();
            },
            error => {
              Alert.alert(
                'Erro',
                'Não foi possível obter a localização atual.',
              );
              console.log('Error:', error);
              reject(error);
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 },
          );
        });
      }
    } catch (error) {
      console.log('Error al abrir la câmera:', error);
    }
  };

  const removeFile = (uri: string) => {
    setMediaFiles(prev => prev.filter(file => file.uri !== uri));
  };

  const saveMediaFile = () => {
    if (!tempLarvaeDetails.trim()) {
      Alert.alert('Erro', 'Adicione uma descrição antes de salvar.');
      return;
    }

    if (previewFile) {
      setMediaFiles(prev => [
        ...prev,
        { ...previewFile, larvaeDetails: tempLarvaeDetails.trim() },
      ]);
      setPreviewFile(null);
      setTempLarvaeDetails('');
      setPreviewModal(false);
    }
  };

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <View style={tw`px-4 mt-10 `}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>
      {!latitude && !longitude ? (
        <View style={tw`items-center justify-center flex-1`}>
          <ActivityIndicator size="large" color="#17375e" />
          <Text style={tw`mt-2 text-blue-sysintel-800`}>Carregando ...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`p-4`}>
          {!inspectionStarted ? (
            <>
              <TouchableOpacity
                style={tw`p-3 mb-4 bg-blue-sysintel-900 rounded-lg`}
                onPress={startInspection} // Usa la nueva versión local
              >
                <Text style={tw`font-bold text-center text-white`}>
                  Realizar Inspeção
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`p-3 bg-red-500 rounded-lg`}
                onPress={noOneAtHome} // Usa la nueva versión offline-ready
              >
                <Text style={tw`font-bold text-center text-white`}>
                  Não havia ninguém
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View>
                <Text style={tw`font-bold text-blue-sysintel-800`}>
                  Número de Adultos
                </Text>

                <TextInput
                  style={tw`p-2 mt-2 mb-4 border border-blue-sysintel-700 text-blue-sysintel-700 rounded-lg`}
                  placeholder="Número de Adultos"
                  keyboardType="numeric"
                  value={numberOfAdults}
                  onChangeText={setNumberOfAdults}
                />
              </View>

              <View>
                <Text style={tw`font-bold text-blue-sysintel-800`}>
                  Número de Crianças
                </Text>
                <TextInput
                  style={tw`p-2 mt-1 mb-4 border border-blue-sysintel-700 text-blue-sysintel-700 rounded-lg`}
                  placeholder="Número de Crianças"
                  keyboardType="numeric"
                  value={numberOfChildren}
                  onChangeText={setNumberOfChildren}
                />
              </View>

              <View style={tw`mb-4 `}>
                <Text
                  style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}
                >
                  Casa em Construção:
                </Text>
                <View style={tw`flex-row items-center gap-4`}>
                  <ToggleButton
                    isToggled={underConstruction}
                    onChangeToggle={value => setUnderConstruction(value)}
                  />
                  <Text style={tw`text-base`}>
                    {underConstruction ? 'Sim' : 'Não'}
                  </Text>
                </View>
              </View>

              {underConstruction && (
                <TextInput
                  style={tw`p-2 mb-4 border border-blue-sysintel-800 text-input-sysintel-800 rounded-lg`}
                  placeholder="Detalhes da Construção"
                  value={constructionDetails}
                  onChangeText={setConstructionDetails}
                />
              )}

              <Text style={tw`mb-2 text-lg font-bold text-blue-sysintel-800`}>
                Características da Construção
              </Text>
              {['Alvenaria', 'Madeira', 'Mista'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={tw`p-2 mb-2 border border-blue-sysintel-700 rounded-lg ${
                    buildingCharacteristics.includes(option)
                      ? 'bg-blue-sysintel-400'
                      : 'bg-blue-sysintel-100'
                  }`}
                  onPress={() =>
                    setBuildingCharacteristics(prev =>
                      prev.includes(option)
                        ? prev.filter(c => c !== option)
                        : [...prev, option],
                    )
                  }
                >
                  <Text
                    style={tw`text-center ${
                      buildingCharacteristics.includes(option)
                        ? 'text-white'
                        : 'text-blue-sysintel-900'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={tw`mb-4 `}>
                <Text
                  style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}
                >
                  Possui Animais:
                </Text>
                <View style={tw`flex-row items-center gap-4`}>
                  <ToggleButton
                    isToggled={hasPets}
                    onChangeToggle={value => setHasPets(value)}
                  />
                  <Text style={tw`text-base`}>{hasPets ? 'Sim' : 'Não'}</Text>
                </View>
              </View>

              {hasPets && (
                <>
                  <Text
                    style={tw`mb-2 text-lg font-bold text-blue-sysintel-800`}
                  >
                    Tipo de Animais
                  </Text>
                  {['Cães', 'Gatos', 'Pássaros', 'Répteis', 'Outros'].map(
                    option => (
                      <TouchableOpacity
                        key={option}
                        style={tw`p-2 mb-2 border rounded-lg ${
                          petTypes.includes(option)
                            ? 'bg-blue-sysintel-400'
                            : 'bg-blue-sysintel-100'
                        }`}
                        onPress={() =>
                          setPetTypes(prev =>
                            prev.includes(option)
                              ? prev.filter(c => c !== option)
                              : [...prev, option],
                          )
                        }
                      >
                        <Text
                          style={tw`text-center ${
                            petTypes.includes(option)
                              ? 'text-white'
                              : 'text-blue-sysintel-900'
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </>
              )}

              <View style={tw`mb-4 `}>
                <Text
                  style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}
                >
                  Possui Piscina:
                </Text>
                <View style={tw`flex-row items-center gap-4`}>
                  <ToggleButton
                    isToggled={hasPool}
                    onChangeToggle={value => setHasPool(value)}
                  />
                  <Text style={tw`text-base`}>{hasPool ? 'Sim' : 'Não'}</Text>
                </View>
              </View>

              {hasPool && (
                <>
                  <Text
                    style={tw`mb-2 text-lg font-bold text-blue-sysintel-800`}
                  >
                    Condições da Piscina
                  </Text>
                  {[
                    'Cheia',
                    'Vazia',
                    'Tratamento Profissional',
                    'Abandonada',
                    'Outros',
                  ].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={tw`p-2 mb-2 border border-blue-sysintel-800 rounded-lg ${
                        poolCondition.includes(option)
                          ? 'bg-blue-sysintel-400'
                          : 'bg-blue-sysintel-100'
                      }`}
                      onPress={() =>
                        setPoolCondition(prev =>
                          prev.includes(option)
                            ? prev.filter(c => c !== option)
                            : [...prev, option],
                        )
                      }
                    >
                      <Text
                        style={tw`text-center ${
                          poolCondition.includes(option)
                            ? 'text-white'
                            : 'text-blue-sysintel-900'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={tw`mb-2 text-lg font-bold text-blue-sysintel-800`}>
                Características dos Endereços Vizinhos
              </Text>

              {['neighbor1', 'neighbor2', 'neighbor3'].map(
                (neighbor, index) => (
                  <View key={neighbor} style={tw`mb-4`}>
                    <Text style={tw`font-bold text-blue-sysintel-800`}>
                      Endereço Vizinho{' '}
                      {index + 1 === 1
                        ? ' (esquerda)'
                        : index + 1 === 2
                        ? ' (de trás)'
                        : ' (direita)'}
                    </Text>

                    {['Lote Vazio', 'Em Construção', 'Residência'].map(
                      option => (
                        <TouchableOpacity
                          key={option}
                          style={tw`p-2 mb-2 border border-blue-sysintel-900 rounded-lg ${
                            neighborCharacteristics[neighbor]?.includes(option)
                              ? 'bg-blue-sysintel-400'
                              : 'bg-blue-sysintel-100'
                          }`}
                          onPress={() => {
                            setNeighborCharacteristics((prev: any) => ({
                              ...prev,
                              [neighbor]: option,
                            }));
                          }}
                        >
                          <Text
                            style={tw`text-center ${
                              neighborCharacteristics[neighbor]?.includes(
                                option,
                              )
                                ? 'text-white'
                                : 'text-blue-sysintel-900 '
                            }`}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}

                    {neighborCharacteristics[neighbor]?.includes(
                      'Residência',
                    ) && (
                      <>
                        {[
                          'Sobrado',
                          'Residência Térrea',
                          'Residência com Andares',
                        ].map(subOption => (
                          <TouchableOpacity
                            key={subOption}
                            style={tw`p-2 mb-2 ml-4 border border-blue-sysintel-900 rounded-lg ${
                              neighborCharacteristics[neighbor] ===
                              `Residência - ${subOption}`
                                ? 'bg-blue-sysintel-500'
                                : 'bg-blue-sysintel-100'
                            }`}
                            onPress={() =>
                              setNeighborCharacteristics((prev: any) => ({
                                ...prev,
                                [neighbor]: `Residência - ${subOption}`,
                              }))
                            }
                          >
                            <Text
                              style={tw`text-center ${
                                neighborCharacteristics[neighbor] ===
                                `Residência - ${subOption}`
                                  ? 'text-white'
                                  : 'text-black'
                              }`}
                            >
                              {subOption}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  </View>
                ),
              )}

              <View style={tw`mb-4 `}>
                <Text
                  style={tw`mb-2 text-base font-bold text-blue-sysintel-900`}
                >
                  Focos de Dengue:
                </Text>
                <View style={tw`flex-row items-center gap-4`}>
                  <ToggleButton
                    isToggled={hasDengueFoci}
                    onChangeToggle={value => setHasDengueFoci(value)}
                  />
                  <Text style={tw`text-base`}>
                    {hasDengueFoci ? 'Sim' : 'Não'}
                  </Text>
                </View>
              </View>

              {hasDengueFoci && (
                <>
                  <TouchableOpacity
                    style={tw`p-2 mb-2 bg-blue-sysintel-800 rounded-lg`}
                    onPress={() => openCamera('photo')}
                  >
                    <Text style={tw`text-center text-white`}>Tirar Foto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={tw`p-2 rounded-lg bg-blue-sysintel-800`}
                    onPress={() => openCamera('video')}
                  >
                    <Text style={tw`text-center text-white`}>Gravar Vídeo</Text>
                  </TouchableOpacity>
                </>
              )}

              {mediaFiles.map((file, idx) => (
                <TouchableOpacity
                  key={file.uri}
                  style={tw`flex-row items-center justify-between p-2 mb-2 bg-blue-sysintel-100 rounded-lg`}
                  onPress={() => {
                    setPreviewIndex(idx);
                    setPreviewType(
                      file.type.startsWith('image') ? 'image' : 'video',
                    );
                  }}
                >
                  {file.type.startsWith('image') ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={tw`w-16 h-16 rounded-lg`}
                    />
                  ) : (
                    <View
                      style={tw`items-center justify-center w-16 h-16 bg-black rounded-lg`}
                    >
                      <Text style={tw`text-xs text-white`}>🎥 Vídeo</Text>
                    </View>
                  )}
                  <Text style={tw`flex-1 ml-2 italic text-gray-500`}>
                    {file.larvaeDetails}
                  </Text>

                  <TouchableOpacity onPress={() => removeFile(file.uri)}>
                    <Text style={tw`text-red-500`}>Remover</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={tw`p-3 mt-4 bg-blue-sysintel-900 rounded-lg`}
                onPress={() => sendInspection(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={tw`font-bold text-center text-white`}>
                    Finalizar Inspeção
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {previewType === 'image' && previewIndex !== null && (
        <ImageViewer
          images={[{ uri: mediaFiles[previewIndex].uri }]}
          imageIndex={0}
          visible={true}
          onRequestClose={() => setPreviewIndex(null)}
        />
      )}

      {previewType === 'video' && previewIndex !== null && (
        <Modal
          transparent
          animationType="slide"
          visible={true}
          onRequestClose={() => setPreviewIndex(null)}
        >
          <TouchableOpacity
            style={tw`flex-1 bg-black`}
            onPress={() => setPreviewIndex(null)}
            activeOpacity={1}
          >
            <Video
              source={{ uri: mediaFiles[previewIndex].uri }}
              style={{ width, height }}
              controls
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      )}

      <Modal visible={previewModal} transparent={true} animationType="slide">
        <View style={tw`items-center justify-center flex-1 bg-black/50`}>
          <View style={tw`p-4 bg-white rounded-lg w-80`}>
            <TextInput
              style={tw`p-2 mb-4 border border-blue-sysintel-900 text-blue-sysintel-900 rounded-lg`}
              placeholder="Descrição da Larva"
              value={tempLarvaeDetails}
              onChangeText={setTempLarvaeDetails}
            />

            <TouchableOpacity
              style={tw`p-2 bg-blue-sysintel-900 rounded-lg`}
              onPress={saveMediaFile}
            >
              <Text style={tw`text-center text-white`}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Inspection;
