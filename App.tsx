import { SafeAreaView } from 'react-native';
import Navigation from './src/Navigation';
import { store } from './src/redux/store';
import { Provider, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken, setUser } from './src/redux/authSlice';
import { fetchAxiosToken } from './src/helpers/fetchAxiosToken';
import { PermissionsAndroid, Platform } from 'react-native';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  rol: string;
  first_login: boolean;
  subdomain: string;
}

export interface ApiResponse {
  statusCode: number;
  message: string;
  payload: User;
  errors: string[];
}
/* console.log('DB lista:', !!database); */
function App(): React.JSX.Element {
  const dispatch = useDispatch();

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permissão de Localização',
          message: 'Este aplicativo precisa acessar sua localização.',
          buttonNeutral: 'Perguntar Depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          dispatch(setToken(token));

          const response: ApiResponse = await fetchAxiosToken({
            url: `users/getOne/token`,
            method: 'post',
          });
          /*  console.log(response); */
          dispatch(
            setUser({
              id: response.payload.id,
              firstName: response.payload.firstName,
              lastName: response.payload.lastName,
              email: response.payload.email,
              phone: response.payload.phone,
              avatar: response.payload.avatar,
              first_login: response.payload.first_login,
              subdomain: response.payload.subdomain,
            }),
          );
        }
      } catch (error) {
        console.error('Error al cargar el token:', error);
      }
    };

    loadToken();
  }, [dispatch]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Navigation />
    </SafeAreaView>
  );
}

export default () => (
  <Provider store={store}>
    <App />
  </Provider>
);
