import React, { useEffect, useState } from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Login from './screens/Login';
import { RootStackParamList } from './helpers/types/navigationProp';
import EditarPerfil from './screens/dashboard/perfil/EditarPerfil';
import CambiarPassword from './screens/dashboard/perfil/CambiarPassword';
import UserList from './screens/dashboard/users/UserList';
import CreateUser from './screens/dashboard/users/CreateUser';
import UserDetail from './screens/dashboard/users/UserDetail';
import RecoverPasswordEmail from './screens/RecoverPassword/RecoverPasswordEmail';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import RecoverPasswordCode from './screens/RecoverPassword/RecoverPasswordCode';
import RecoverPasswordNew from './screens/RecoverPassword/RecoverPasswordNew';
import GroupList from './screens/dashboard/groups/GroupList';
import CreateGroup from './screens/dashboard/groups/CreateGroup';
import GroupDetail from './screens/dashboard/groups/GroupDetail';
import FirstLogint from './screens/FirstLogint';
import { ActivityIndicator } from 'react-native';
import ZonesList from './screens/dashboard/zones/ZonesList';
import CreateZone from './screens/dashboard/zones/CreateZone';
import ZoneDetail from './screens/dashboard/zones/ZoneDetail';
import GroupVisitScheduleList from './screens/dashboard/groupVisitSchedule/GroupVisitScheduleList';
import GroupVisitScheduleCreate from './screens/dashboard/groupVisitSchedule/GroupVisitScheduleCreate';
import GroupVisitScheduleDetails from './screens/dashboard/groupVisitSchedule/GroupVisitScheduleDetails';

import HouseInspection from './screens/dashboard/inspection/HouseInspection';
import HouseInspections from './screens/dashboard/inspection/HouseInspections';
import Inspection from './screens/dashboard/inspection/Inspection';
import CreateHouse from './screens/dashboard/inspection/CreateHouse';
import InspectionDetail from './screens/dashboard/inspection/InspectionDetail';
import Observations from './screens/dashboard/inspection/Observations';

import TicketDetail from './screens/dashboard/support/TicketDetail';
import SupportTickets from './screens/dashboard/support/SupportTickets';
import Welcome from './screens/Welcome';

const Stack = createStackNavigator<RootStackParamList>();

const Navigation = () => {
  /*  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | undefined
  >(undefined); */
  const token = useSelector((state: RootState) => state.auth.token);
  const userRedux = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo se llama una vez para establecer el estado de carga

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />; // Solo muestra un loader
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token && (
          <React.Fragment>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false, gestureEnabled: false }}
            />

            <Stack.Screen
              name="RecoverPasswordEmail"
              component={RecoverPasswordEmail}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="RecoverPasswordCode"
              component={RecoverPasswordCode}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="RecoverPasswordNew"
              component={RecoverPasswordNew}
              options={{ headerShown: false }}
            />
          </React.Fragment>
        )}

        {token && userRedux?.first_login && (
          <React.Fragment>
            <Stack.Screen
              name="FirstLogin"
              component={FirstLogint}
              options={{ headerShown: false }}
            />
          </React.Fragment>
        )}

        {token && !userRedux?.first_login && (
          <React.Fragment>
            <Stack.Screen
              name="Welcome"
              component={Welcome}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditarPerfil"
              component={EditarPerfil}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="UserList"
              component={UserList}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CambiarPassword"
              component={CambiarPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateUser"
              component={CreateUser}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="UserDetail"
              component={UserDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupList"
              component={GroupList}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroup}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupDetail"
              component={GroupDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ZoneList"
              component={ZonesList}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateZone"
              component={CreateZone}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ZoneDetail"
              component={ZoneDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupVisitScheduleList"
              component={GroupVisitScheduleList}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupVisitScheduleCreate"
              component={GroupVisitScheduleCreate}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupVisitScheduleDetail"
              component={GroupVisitScheduleDetails}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HouseInspection"
              component={HouseInspection}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HouseInspections"
              component={HouseInspections}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Inspection"
              component={Inspection}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateHouse"
              component={CreateHouse}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InspectionDetail"
              component={InspectionDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Observations"
              component={Observations}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SupportTickets"
              component={SupportTickets}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="TicketDetail"
              component={TicketDetail}
              options={{ headerShown: false }}
            />
          </React.Fragment>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
