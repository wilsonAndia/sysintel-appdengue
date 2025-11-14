// types.ts
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Define los tipos de tus rutas aquí
export type RootStackParamList = {
  Login: undefined;
  EditarPerfil: undefined;
  CambiarPassword: undefined;
  UserList: undefined;
  CreateUser: undefined;
  UserDetail: {id: string};
  GroupDetail: {id: string};
  ZoneDetail: {id: string};
  GroupList: undefined;
  CreateGroup: undefined;
  RecoverPasswordEmail: undefined;
  RecoverPasswordCode: {user: User};
  RecoverPasswordNew: {user: User};
  FirstLogin: undefined;
  GroupVisitScheduleList: undefined;
  GroupVisitScheduleCreate: undefined;
  GroupVisitScheduleDetail: {id: string};
  ZoneList: undefined;
  CreateZone: undefined;
  GroupVisitSchedule: undefined;
  HouseInspection: undefined;
  HouseInspections: {id: string};
  Inspection: {houseId: string};
  CreateHouse: undefined;
  InspectionDetail: {id: string};
  Observations: {houseId: string};
  SupportTickets: undefined;
  TicketDetail: {ticketId: string};
};

// Define el tipo de navegación
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
