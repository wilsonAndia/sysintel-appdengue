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

  const headers: any = {
    Authorization: `Bearer ${token}`,
    'x-subdomain': subdomain || '',
  };

  /*  if (isFormData) {
    headers['Content-Type'] = 'multipart/form-data';
  } */

  console.log({
    BASE_URL,
    method,
    body,
    subdomain,
    isFormData,
    headers,
  });
  const { data } = await axios({
    method: method || 'get',
    url: `${BASE_URL}${url}`,
    data: body || '',
    headers,
  });

  return data;
};
