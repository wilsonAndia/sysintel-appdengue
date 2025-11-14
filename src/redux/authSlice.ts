import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  first_login: boolean;
  subdomain: string;
  // Añade otros campos que necesites
}

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    clearToken(state) {
      state.token = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
  },
});

export const {setToken, clearToken, setUser} = authSlice.actions;
export default authSlice.reducer;
