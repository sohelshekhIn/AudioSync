import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar} from 'react-native';
import HomeScreen from './screens/HomeScreen';
import DeviceListScreen from './screens/DeviceListScreen';
import AudioPlayerScreen from './screens/AudioPlayerScreen';
import SettingsScreen from './screens/SettingsScreen';
import {AudioSyncProvider} from './context/AudioSyncContext';

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <AudioSyncProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'AudioSync'}}
          />
          <Stack.Screen
            name="DeviceList"
            component={DeviceListScreen}
            options={{title: 'Connected Devices'}}
          />
          <Stack.Screen
            name="AudioPlayer"
            component={AudioPlayerScreen}
            options={{title: 'Audio Player'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AudioSyncProvider>
  );
};

export default App;
