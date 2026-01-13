import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

interface Props {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  body?: object;
  isFormData?: boolean;
}

export const fetchAxiosToken = async ({
  url,
  method,
  body,
  subdomain,
  isFormData = false,
}: Props & { subdomain?: string }) => {
  const BASE_URL = API_URL;
  let token = await AsyncStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-subdomain': subdomain || '',
  };
  /*   console.log(headers); */
  console.log(`${BASE_URL}${url}`);
  const { data } = await axios({
    method: method || 'get',
    url: `${BASE_URL}${url}`,
    data: body || '',
    headers,
  });

  return data;
};
