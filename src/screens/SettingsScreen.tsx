import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAudioSync} from '../context/AudioSyncContext';

const SettingsScreen: React.FC = () => {
  const {state, setServerUrl} = useAudioSync();
  const [tempServerUrl, setTempServerUrl] = useState(state.serverUrl);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(false);
  const [bufferSize, setBufferSize] = useState('4096');

  const handleSaveSettings = () => {
    if (tempServerUrl !== state.serverUrl) {
      setServerUrl(tempServerUrl);
    }
    Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setTempServerUrl('ws://192.168.1.100:8080');
            setAutoReconnect(true);
            setEnableNotifications(true);
            setHighQualityAudio(false);
            setBufferSize('4096');
          },
        },
      ],
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#E0E0E0', true: '#81C784'}}
        thumbColor={value ? '#4CAF50' : '#BDBDBD'}
      />
    </View>
  );

  const renderInputItem = (
    title: string,
    subtitle: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: 'default' | 'numeric',
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Connection Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>

          {renderInputItem(
            'Server URL',
            'WebSocket server address for AudioSync',
            tempServerUrl,
            setTempServerUrl,
            'ws://192.168.1.100:8080',
          )}

          {renderSettingItem(
            'Auto Reconnect',
            'Automatically reconnect when connection is lost',
            autoReconnect,
            setAutoReconnect,
          )}

          <View style={styles.connectionStatus}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      state.connectionState === 'connected'
                        ? '#4CAF50'
                        : state.connectionState === 'connecting'
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                Status: {state.connectionState.charAt(0).toUpperCase() + state.connectionState.slice(1)}
              </Text>
            </View>
            {state.latency > 0 && (
              <Text style={styles.latencyText}>
                Latency: {Math.round(state.latency * 1000)}ms
              </Text>
            )}
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>

          {renderSettingItem(
            'High Quality Audio',
            'Use higher bitrate for better audio quality (uses more bandwidth)',
            highQualityAudio,
            setHighQualityAudio,
          )}

          {renderInputItem(
            'Buffer Size',
            'Audio buffer size in bytes (lower = less latency, higher = more stable)',
            bufferSize,
            setBufferSize,
            '4096',
            'numeric',
          )}

          <View style={styles.audioInfo}>
            <Text style={styles.audioInfoTitle}>Current Audio Settings</Text>
            <Text style={styles.audioInfoText}>Sample Rate: 44.1 kHz</Text>
            <Text style={styles.audioInfoText}>Channels: Stereo (2)</Text>
            <Text style={styles.audioInfoText}>Bit Depth: 16-bit</Text>
            <Text style={styles.audioInfoText}>
              Quality: {highQualityAudio ? 'High (320 kbps)' : 'Standard (128 kbps)'}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          {renderSettingItem(
            'Enable Notifications',
            'Receive notifications about connection status and streaming',
            enableNotifications,
            setEnableNotifications,
          )}
        </View>

        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>

          <View style={styles.deviceInfo}>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceInfoLabel}>Device Name:</Text>
              <Text style={styles.deviceInfoValue}>
                {state.currentDevice?.name || 'Unknown Device'}
              </Text>
            </View>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceInfoLabel}>Platform:</Text>
              <Text style={styles.deviceInfoValue}>
                {state.currentDevice?.platform || 'Unknown'}
              </Text>
            </View>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceInfoLabel}>Device ID:</Text>
              <Text style={styles.deviceInfoValue}>
                {state.currentDevice?.id || 'Not connected'}
              </Text>
            </View>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceInfoLabel}>Capabilities:</Text>
              <Text style={styles.deviceInfoValue}>
                {state.currentDevice?.capabilities?.join(', ') || 'None'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveSettings}>
            <Icon name="save" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleResetSettings}>
            <Icon name="refresh" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutInfo}>
            <Text style={styles.aboutTitle}>AudioSync</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Cross-platform audio synchronization app for multi-device audio streaming
              with low latency and dynamic connectivity.
            </Text>

            <View style={styles.aboutLinks}>
              <TouchableOpacity style={styles.linkButton}>
                <Icon name="help" size={20} color="#2196F3" />
                <Text style={styles.linkText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton}>
                <Icon name="info" size={20} color="#2196F3" />
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
    minWidth: 120,
  },
  connectionStatus: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  latencyText: {
    fontSize: 14,
    color: '#666666',
  },
  audioInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  audioInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  audioInfoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  deviceInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  deviceInfoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  aboutInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  aboutLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default SettingsScreen;
