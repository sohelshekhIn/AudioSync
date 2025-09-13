import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAudioSync} from '../context/AudioSyncContext';
import {Device} from '../types';

const DeviceListScreen: React.FC = () => {
  const {state} = useAudioSync();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, you might trigger a device discovery here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getDeviceIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'ios':
        return 'phone-iphone';
      case 'android':
        return 'phone-android';
      case 'windows':
        return 'computer';
      case 'macos':
        return 'laptop-mac';
      default:
        return 'speaker';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 0.05) {return '#4CAF50';} // Green - Excellent
    if (latency < 0.1) {return '#FF9800';}  // Orange - Good
    return '#F44336'; // Red - Poor
  };

  const getLatencyText = (latency: number) => {
    if (latency < 0.05) {return 'Excellent';}
    if (latency < 0.1) {return 'Good';}
    return 'Poor';
  };

  const renderDeviceItem = ({item}: {item: Device}) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <Icon
          name={getDeviceIcon(item.platform)}
          size={32}
          color="#2196F3"
        />
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceId}>ID: {item.id}</Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            {backgroundColor: item.enabled !== false ? '#4CAF50' : '#F44336'},
          ]}
        />
      </View>

      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Platform:</Text>
          <Text style={styles.detailValue}>
            {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
          </Text>
        </View>

        {item.average_latency !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Latency:</Text>
            <View style={styles.latencyInfo}>
              <Text style={styles.detailValue}>
                {Math.round(item.average_latency * 1000)}ms
              </Text>
              <Text
                style={[
                  styles.latencyQuality,
                  {color: getLatencyColor(item.average_latency)},
                ]}>
                ({getLatencyText(item.average_latency)})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Capabilities:</Text>
          <View style={styles.capabilitiesContainer}>
            {item.capabilities.map((capability, index) => (
              <View key={index} style={styles.capabilityTag}>
                <Text style={styles.capabilityText}>{capability}</Text>
              </View>
            ))}
          </View>
        </View>

        {item.last_seen && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Seen:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.last_seen * 1000).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {/* Device Actions */}
      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.enabled !== false ? styles.disableButton : styles.enableButton,
          ]}>
          <Icon
            name={item.enabled !== false ? 'volume-off' : 'volume-up'}
            size={20}
            color="#ffffff"
          />
          <Text style={styles.actionButtonText}>
            {item.enabled !== false ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.infoButton]}>
          <Icon name="info" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="speaker-group" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Devices Connected</Text>
      <Text style={styles.emptyMessage}>
        Connect devices to the AudioSync server to see them here.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Icon name="refresh" size={20} color="#2196F3" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (state.connectionState !== 'connected') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="wifi-off" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Not Connected</Text>
          <Text style={styles.errorMessage}>
            Please connect to the AudioSync server first
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{state.devices.length}</Text>
          <Text style={styles.statLabel}>
            Device{state.devices.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {state.devices.filter(d => d.enabled !== false).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {state.latency > 0 ? `${Math.round(state.latency * 1000)}ms` : '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Latency</Text>
        </View>
      </View>

      {/* Device List */}
      <FlatList
        data={state.devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  deviceId: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  latencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latencyQuality: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  capabilityTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
    marginBottom: 4,
  },
  capabilityText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
  },
  disableButton: {
    backgroundColor: '#F44336',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  refreshButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default DeviceListScreen;
