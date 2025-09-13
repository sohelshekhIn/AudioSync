import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
// import Slider from '@react-native-community/slider';
// Note: You'll need to install @react-native-community/slider
// For now, we'll use a simple TouchableOpacity as volume control
import { useAudioSync } from "../context/AudioSyncContext";

const AudioPlayerScreen: React.FC = () => {
  const { state, startStreaming, stopStreaming, setVolume } = useAudioSync();
  const [selectedAudio, setSelectedAudio] = useState<string>("test_audio.wav");

  const audioFiles = [
    { name: "Test Audio", file: "test_audio.wav" },
    { name: "Demo Music", file: "demo_music.mp3" },
    { name: "Sine Wave 440Hz", file: "sine_440.wav" },
    { name: "White Noise", file: "white_noise.wav" },
  ];

  const handleStartStreaming = async () => {
    try {
      await startStreaming(selectedAudio);
    } catch (error) {
      Alert.alert("Streaming Error", "Failed to start audio streaming");
    }
  };

  const handleStopStreaming = async () => {
    try {
      await stopStreaming();
    } catch (error) {
      Alert.alert("Streaming Error", "Failed to stop audio streaming");
    }
  };

  const handleVolumeChange = (volume: number) => {
    setVolume(volume);
  };

  if (state.connectionState !== "connected") {
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
      <ScrollView style={styles.scrollView}>
        {/* Playback Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon
              name={
                state.isStreaming ? "play-circle-filled" : "pause-circle-filled"
              }
              size={48}
              color={state.isStreaming ? "#4CAF50" : "#9E9E9E"}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {state.isStreaming ? "Streaming Active" : "Ready to Stream"}
              </Text>
              <Text style={styles.statusSubtitle}>
                {state.devices.length} device
                {state.devices.length !== 1 ? "s" : ""} connected
              </Text>
            </View>
          </View>

          {state.currentAudio && (
            <View style={styles.currentAudio}>
              <Text style={styles.currentAudioLabel}>Current Audio:</Text>
              <Text style={styles.currentAudioName}>{state.currentAudio}</Text>
            </View>
          )}
        </View>

        {/* Audio Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Audio File</Text>
          {audioFiles.map((audio, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.audioOption,
                selectedAudio === audio.file && styles.audioOptionSelected,
              ]}
              onPress={() => setSelectedAudio(audio.file)}
            >
              <Icon
                name={
                  selectedAudio === audio.file
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={24}
                color={selectedAudio === audio.file ? "#2196F3" : "#9E9E9E"}
              />
              <View style={styles.audioInfo}>
                <Text style={styles.audioName}>{audio.name}</Text>
                <Text style={styles.audioFile}>{audio.file}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Volume Control */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume Control</Text>
          <View style={styles.volumeContainer}>
            <Icon name="volume-down" size={24} color="#666666" />
            <View style={styles.volumeSliderContainer}>
              <View style={styles.volumeTrack}>
                <View
                  style={[
                    styles.volumeProgress,
                    { width: `${state.volume * 100}%` },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[styles.volumeThumb, { left: `${state.volume * 85}%` }]}
                onPress={() => {
                  // Simple volume toggle for demo - in real app you'd implement proper slider
                  handleVolumeChange(state.volume > 0.5 ? 0.3 : 0.8);
                }}
              />
            </View>
            <Icon name="volume-up" size={24} color="#666666" />
          </View>
          <Text style={styles.volumeText}>
            Volume: {Math.round(state.volume * 100)}%
          </Text>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsContainer}>
          {!state.isStreaming ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={handleStartStreaming}
            >
              <Icon name="play-arrow" size={32} color="#ffffff" />
              <Text style={styles.controlButtonText}>Start Streaming</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopStreaming}
            >
              <Icon name="stop" size={32} color="#ffffff" />
              <Text style={styles.controlButtonText}>Stop Streaming</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Device Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connected Devices</Text>
          {state.devices.length === 0 ? (
            <Text style={styles.noDevicesText}>No devices connected</Text>
          ) : (
            state.devices.map((device, _index) => (
              <View key={device.id} style={styles.deviceItem}>
                <Icon name="speaker" size={24} color="#2196F3" />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.devicePlatform}>
                    {device.platform} •{" "}
                    {device.average_latency
                      ? `${Math.round(device.average_latency * 1000)}ms latency`
                      : "No latency data"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.deviceStatus,
                    {
                      backgroundColor:
                        device.enabled !== false ? "#4CAF50" : "#F44336",
                    },
                  ]}
                />
              </View>
            ))
          )}
        </View>

        {/* Sync Information */}
        {state.latency > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Synchronization</Text>
            <View style={styles.syncInfo}>
              <View style={styles.syncItem}>
                <Text style={styles.syncLabel}>Network Latency:</Text>
                <Text style={styles.syncValue}>
                  {Math.round(state.latency * 1000)}ms
                </Text>
              </View>
              <View style={styles.syncItem}>
                <Text style={styles.syncLabel}>Sync Quality:</Text>
                <Text
                  style={[
                    styles.syncValue,
                    {
                      color:
                        state.latency < 0.05
                          ? "#4CAF50"
                          : state.latency < 0.1
                          ? "#FF9800"
                          : "#F44336",
                    },
                  ]}
                >
                  {state.latency < 0.05
                    ? "Excellent"
                    : state.latency < 0.1
                    ? "Good"
                    : "Poor"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F44336",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  currentAudio: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  currentAudioLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  currentAudioName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  audioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  audioOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  audioInfo: {
    marginLeft: 12,
    flex: 1,
  },
  audioName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  audioFile: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  volumeSliderContainer: {
    flex: 1,
    marginHorizontal: 16,
    height: 40,
    justifyContent: "center",
  },
  volumeTrack: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  volumeProgress: {
    height: 4,
    backgroundColor: "#2196F3",
    borderRadius: 2,
  },
  volumeThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    top: -8,
  },
  volumeText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  playButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 8,
  },
  noDevicesText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  deviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  devicePlatform: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  deviceStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncInfo: {
    flexDirection: "column",
  },
  syncItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  syncLabel: {
    fontSize: 16,
    color: "#666666",
  },
  syncValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
});

export default AudioPlayerScreen;
