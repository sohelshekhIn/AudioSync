import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAudioSync} from '../context/AudioSyncContext';
import {StackNavigationProp} from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  DeviceList: undefined;
  AudioPlayer: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {state, connect, disconnect} = useAudioSync();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to AudioSync server');
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const getConnectionStatusColor = () => {
    switch (state.connectionState) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <Icon name="speaker-group" size={48} color="#ffffff" />
        <Text style={styles.headerTitle}>AudioSync</Text>
        <Text style={styles.headerSubtitle}>Multi-Device Audio Streaming</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIndicator,
              {backgroundColor: getConnectionStatusColor()},
            ]}
          />
          <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
        </View>
        
        {state.connectionState === 'connected' && (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceCount}>
              {state.devices.length} device{state.devices.length !== 1 ? 's' : ''} connected
            </Text>
            {state.latency > 0 && (
              <Text style={styles.latencyText}>
                Latency: {Math.round(state.latency * 1000)}ms
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        {state.connectionState === 'connected' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('AudioPlayer')}>
              <Icon name="play-circle-filled" size={32} color="#ffffff" />
              <Text style={styles.buttonText}>Audio Player</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('DeviceList')}>
              <Icon name="devices" size={32} color="#2196F3" />
              <Text style={[styles.buttonText, {color: '#2196F3'}]}>
                Manage Devices
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDisconnect}>
              <Icon name="power-off" size={32} color="#ffffff" />
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleConnect}
            disabled={state.connectionState === 'connecting'}>
            <Icon
              name={state.connectionState === 'connecting' ? 'sync' : 'wifi'}
              size={32}
              color="#ffffff"
            />
            <Text style={styles.buttonText}>
              {state.connectionState === 'connecting' ? 'Connecting...' : 'Connect to Server'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Button */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={24} color="#666666" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Streaming Indicator */}
      {state.isStreaming && (
        <View style={styles.streamingIndicator}>
          <Icon name="graphic-eq" size={24} color="#4CAF50" />
          <Text style={styles.streamingText}>Streaming Active</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginTop: 4,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  deviceInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deviceCount: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  latencyText: {
    fontSize: 14,
    color: '#666666',
  },
  actionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  settingsText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  streamingIndicator: {
    position: 'absolute',
    top: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streamingText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default HomeScreen;
