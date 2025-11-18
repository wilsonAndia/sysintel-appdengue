import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import tw from '../../../../tailwind';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/core';
import { fetchAxiosToken } from '../../../helpers/fetchAxiosToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import Navbar from '../../../components/NavBar';
import { ButtonRegresar } from '../../../helpers/ButtonRegresar';
import axios from 'axios';
import { API_URL } from '@env';

type TicketRouteProp = RouteProp<{ params: { ticketId: string } }, 'params'>;
interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    type: string;
  }[];
}

type PendingAttachment = {
  fileName: string;
  fileUrl: string;
  type: 'image';
  previewUri: string;
};

export default function TicketDetail() {
  const route = useRoute<TicketRouteProp>();
  const navigation = useNavigation();
  const { ticketId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchTicket();
  }, []);

  const openImage = (fileUrl: string) => {
    const fullUrl = `${API_URL}support/getImage/${fileUrl}`;
    setSelectedImageUrl(fullUrl);
    setImageModalVisible(true);
  };

  const fetchTicket = async () => {
    try {
      const res = await fetchAxiosToken({
        url: `support/ticket/${ticketId}`,
        method: 'get',
      });
      setMessages(res.messages || []);
      // Scroll al final
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        200,
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPresignedUrl = async (fileName: string, mimeType: string) => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get(`${API_URL}support/media/upload-url`, {
      params: { fileName, contentType: mimeType },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data as { url: string; key: string };
  };

  const uploadToS3 = async (
    uri: string,
    mimeType: string,
    signedUrl: string,
  ) => {
    const resp = await fetch(uri);
    const blob = await resp.blob();

    try {
      const result = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });

      if (!result.ok) throw new Error('Erro ao subir arquivo');
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const pickImage = async () => {
    try {
      setSending(true);
      const { assets } = await launchImageLibrary({ mediaType: 'photo' });
      if (!assets || !assets.length) {
        setSending(false);
        return;
      }

      const file = assets[0];
      const { url: signedUrl, key } = await getPresignedUrl(
        file.fileName!,
        file.type!,
      );

      await uploadToS3(file.uri!, file.type!, signedUrl);

      setAttachments(prev => [
        ...prev,
        {
          fileName: file.fileName!,
          fileUrl: key, //
          type: 'image',
          previewUri: file.uri!,
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível anexar a imagem.');
    } finally {
      setSending(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicket();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    const hasText = !!text.trim();
    const hasAttachments = attachments.length > 0;
    if (!hasText && !hasAttachments) return;

    try {
      setSending(true);

      const payload = {
        ticketId,
        senderId: currentUserId,
        message: text.trim(),
        attachments: attachments.map(a => ({
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          type: 'image',
        })),
      };

      await fetchAxiosToken({
        url: `support/create/message`,
        method: 'post',
        body: payload,
      });

      setText('');
      setAttachments([]);
      await fetchTicket();
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender.id === currentUserId;
    return (
      <View
        style={[
          tw`my-2 p-3 rounded-xl max-w-3/4`,
          isMe ? tw`self-end bg-blue-sysintel-800` : tw`self-start bg-gray-200`,
        ]}
      >
        {item.attachments.map(att => (
          <TouchableOpacity key={att.id} onPress={() => openImage(att.fileUrl)}>
            <Image
              source={{
                uri: `${API_URL}support/getImage/${att.fileUrl}`,
              }}
              style={styles.image}
            />
          </TouchableOpacity>
        ))}
        {item.message.length > 0 && (
          <Text style={isMe ? tw`text-white` : tw`text-gray-800`}>
            {item.message}
          </Text>
        )}
        <Text
          style={[
            tw`text-xs mt-1`,
            isMe ? tw`text-blue-sysintel-100` : tw`text-gray-500`,
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <ActivityIndicator size="large" color="#144c78" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <Navbar />
      <View style={tw`px-1 mt-6 mb-4`}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>
      <KeyboardAvoidingView
        style={tw`flex-1 border-t border-gray-300`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={tw`p-4 flex-grow`}
          refreshing={refreshing || loading}
          onRefresh={onRefresh}
          progressViewOffset={20}
          showsVerticalScrollIndicator={false}
        />

        {attachments.length > 0 && (
          <FlatList
            horizontal
            style={tw`px-4 py-3`}
            contentContainerStyle={tw`items-center`}
            data={attachments}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={tw`mr-3 relative`}>
                <Image
                  source={{ uri: item.previewUri }}
                  style={tw`w-16 h-16 rounded-lg`}
                />
                <TouchableOpacity
                  onPress={() => removeAttachment(index)}
                  style={tw`absolute -top-1 -right-2 bg-red-500 rounded-full px-2 py-1`}
                >
                  <Text style={tw`text-white text-xs`}>X</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
        <View style={tw`flex-row items-center p-2 border-t border-gray-300`}>
          <TextInput
            style={tw`flex-1 h-10 px-4 bg-gray-100 rounded-full`}
            placeholder="Escreva..."
            value={text}
            onChangeText={setText}
          />

          {sending ? (
            <ActivityIndicator size="small" color="#144c78" style={tw`ml-2`} />
          ) : (
            <>
              <TouchableOpacity
                style={tw`ml-2 p-2`}
                onPress={pickImage}
                disabled={sending}
              >
                <Text>📷</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`ml-2 p-2`}
                onPress={sendMessage}
                disabled={sending || (!text.trim() && attachments.length === 0)}
              >
                <Text>➤</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Modal visible={imageModalVisible} transparent>
          <View style={tw`flex-1 bg-black items-center justify-center`}>
            {selectedImageUrl ? (
              <Image
                source={{ uri: selectedImageUrl }}
                style={tw`w-full h-full`}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              onPress={() => {
                setImageModalVisible(false);
                setSelectedImageUrl(null);
              }}
              style={tw`absolute top-10 right-10 bg-red-500 px-3 py-2 rounded-full`}
            >
              <Text style={tw`text-white`}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 180,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
});
