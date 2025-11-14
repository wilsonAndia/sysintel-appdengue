import {configureStore} from '@reduxjs/toolkit';
import authReducer from './authSlice';
import zonesReducer from './zonesSlice';
import inTheAreaReducer from './inTheAreaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zonesReducer,
    inTheArea: inTheAreaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
