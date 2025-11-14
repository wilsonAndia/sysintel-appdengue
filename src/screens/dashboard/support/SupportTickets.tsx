import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import tw from '../../../../tailwind';
import Navbar from '../../../components/NavBar';
import {ButtonRegresar} from '../../../helpers/ButtonRegresar';
import {fetchAxiosToken} from '../../../helpers/fetchAxiosToken';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '../../../helpers/types/navigationProp';

interface Ticket {
  id: string;
  createdAt: string;
  status: string;
  firstMessage: {
    id: string;
    message: string;
    createdAt: string;
  };
}

const SupportTickets: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [createVisible, setCreateVisible] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetchAxiosToken({
        url: 'support/tickets/user',
        method: 'get',
      });
      if (response.statusCode === 200) {
        setTickets(response.payload);
      } else {
        console.log('Error fetching tickets:', response.message);
        Alert.alert('Erro', 'Não foi possível obter os tickets.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Houve um problema ao buscar os tickets.');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    const msg = newMessage.trim();
    if (!msg) {
      Alert.alert('Atenção', 'Por favor, descreva seu problema.');
      return;
    }
    try {
      setCreating(true);
      const res = await fetchAxiosToken({
        url: 'support/create-ticket',
        method: 'post',
        body: {message: msg},
      });

      if (res.statusCode === 201 || res.statusCode === 200) {
        setCreateVisible(false);
        setNewMessage('');
        await fetchTickets();

        const createdId = res?.payload?.id;
        if (createdId) {
          navigation.navigate('TicketDetail', {ticketId: createdId});
        }
      } else {
        Alert.alert('Erro', 'Não foi possível criar o ticket.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Houve um problema ao criar o ticket.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border border-yellow-400';
      case 'active':
        return 'bg-green-100 border border-green-400';
      case 'closed':
        return 'bg-red-100 border border-red-400';
      default:
        return 'bg-gray-100 border border-gray-300';
    }
  };

  const renderItem = ({item}: {item: Ticket}) => (
    <TouchableOpacity
      style={tw.style(
        'p-4 mb-4 rounded-lg shadow-md',
        getStatusClasses(item.status),
      )}
      onPress={() => navigation.navigate('TicketDetail', {ticketId: item.id})}>
      <Text style={tw`text-lg font-bold text-blue-sysintel-900`}>
        {item.firstMessage.message}
      </Text>
      <Text style={tw`text-blue-sysintel-800`}>Status: {item.status}</Text>
      <Text style={tw`text-blue-sysintel-800`}>
        Criado em:{' '}
        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`w-full h-full bg-white`}>
      <Navbar />
      <View style={tw`px-4 mt-10`}>
        <ButtonRegresar textColor="white" arrowColor="white" />
      </View>

      <View style={tw`px-4 mt-6 mb-4 flex `}>
        <Text style={tw`text-xl font-bold text-blue-sysintel-900`}>
          Meus Tickets
        </Text>
        <TouchableOpacity
          style={tw`px-4 py-2 rounded-lg bg-blue-sysintel-800 mt-4`}
          onPress={() => setCreateVisible(true)}>
          <Text style={tw`font-bold text-white`}>+ Novo Ticket</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={ticket => ticket.id}
        contentContainerStyle={tw`px-4 py-4 flex-grow`}
        renderItem={renderItem}
        refreshing={refreshing || loading}
        onRefresh={onRefresh}
        progressViewOffset={20}
        ListEmptyComponent={
          loading ? (
            <View style={tw`flex-1 items-center justify-center`}>
              <ActivityIndicator size="large" color="#144c78" />
              <Text style={tw`mt-2 text-blue-sysintel-100`}>
                Carregando tickets...
              </Text>
            </View>
          ) : (
            <View style={tw`items-center justify-center flex-1`}>
              <Text style={tw`text-lg text-center text-blue-sysintel-800`}>
                Nenhum ticket encontrado.
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={createVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}>
        <View
          style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
          <View style={tw`bg-white w-11/12 rounded-lg p-4`}>
            <Text style={tw`text-lg font-bold mb-2 text-blue-sysintel-900`}>
              Descreva seu problema
            </Text>
            <TextInput
              style={tw`h-32 bg-gray-100 rounded-lg p-3 text-base`}
              placeholder="Escreva aqui..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={tw`flex-row justify-end mt-4`}>
              <TouchableOpacity
                style={tw`px-4 py-2 rounded-lg bg-gray-300 mr-2`}
                onPress={() => {
                  setCreateVisible(false);
                  setNewMessage('');
                }}
                disabled={creating}>
                <Text style={tw`font-bold text-gray-800`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`px-4 py-2 rounded-lg bg-blue-sysintel-800`}
                onPress={createTicket}
                disabled={creating}>
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={tw`font-bold text-white`}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SupportTickets;
