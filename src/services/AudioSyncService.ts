import {Platform} from 'react-native';
import Sound from 'react-native-sound';
import {Device, AudioChunk, ConnectionState, ServerMessage} from '../types';
import {AudioBuffer} from './AudioBuffer';
import {SyncManager} from './SyncManager';

export class AudioSyncService {
  private websocket: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private currentDevice: Device | null = null;
  private audioBuffer: AudioBuffer;
  private syncManager: SyncManager;
  private isStreaming = false;
  private volume = 1.0;
  
  // Event callbacks
  private onConnectionStateChangeCallback?: (state: ConnectionState) => void;
  private onDeviceListUpdateCallback?: (devices: Device[]) => void;
  private onStreamingStateChangeCallback?: (isStreaming: boolean) => void;
  private onLatencyUpdateCallback?: (latency: number) => void;

  constructor() {
    // Enable playback in silence mode for iOS
    Sound.setCategory('Playback');
    
    this.audioBuffer = new AudioBuffer();
    this.syncManager = new SyncManager();
    
    this.currentDevice = {
      id: '',
      name: this.getDeviceName(),
      platform: Platform.OS,
      capabilities: ['audio_playback', 'websocket'],
      latency: 0,
    };
  }

  private getDeviceName(): string {
    const platform = Platform.OS;
    const version = Platform.Version;
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device ${version}`;
  }

  public async connect(serverUrl: string): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.setConnectionState('connecting');

    try {
      this.websocket = new WebSocket(serverUrl);
      
      this.websocket.onopen = () => {
        this.setConnectionState('connected');
        this.sendDeviceInfo();
      };

      this.websocket.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setConnectionState('error');
      };

      this.websocket.onclose = () => {
        this.setConnectionState('disconnected');
        this.cleanup();
      };

    } catch (error) {
      console.error('Connection error:', error);
      this.setConnectionState('error');
      throw error;
    }
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.setConnectionState('disconnected');
    this.cleanup();
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.onConnectionStateChangeCallback?.(state);
  }

  private sendDeviceInfo(): void {
    if (!this.websocket || this.connectionState !== 'connected') {
      return;
    }

    const deviceInfo = {
      type: 'device_info',
      device_name: this.currentDevice?.name,
      platform: Platform.OS,
      capabilities: ['audio_playback', 'websocket'],
      latency: this.currentDevice?.latency || 0,
    };

    this.websocket.send(JSON.stringify(deviceInfo));
  }

  private handleServerMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);

      switch (message.type) {
        case 'connection':
          this.handleConnectionMessage(message);
          break;
        case 'device_list':
          this.handleDeviceListMessage(message);
          break;
        case 'prepare_streaming':
          this.handlePrepareStreaming(message);
          break;
        case 'audio_chunk':
          this.handleAudioChunk(message);
          break;
        case 'stop_streaming':
          this.handleStopStreaming();
          break;
        case 'sync_response':
          this.handleSyncResponse(message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing server message:', error);
    }
  }

  private handleConnectionMessage(message: ServerMessage): void {
    if (this.currentDevice) {
      this.currentDevice.id = message.client_id;
    }
    console.log('Connected to server:', message.message);
  }

  private handleDeviceListMessage(message: ServerMessage): void {
    const devices: Device[] = message.devices || [];
    this.onDeviceListUpdateCallback?.(devices);
  }

  private async handlePrepareStreaming(message: ServerMessage): Promise<void> {
    console.log('Preparing for streaming:', message);
    
    this.audioBuffer.initialize({
      sample_rate: message.sample_rate || 44100,
      channels: message.channels || 2,
      bit_depth: 16,
    });

    this.syncManager.setSyncTimestamp(message.sync_timestamp);
    this.isStreaming = true;
    this.onStreamingStateChangeCallback?.(true);
  }

  private async handleAudioChunk(chunk: AudioChunk): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    // Add chunk to buffer
    this.audioBuffer.addChunk(chunk);

    // Send acknowledgment
    this.sendAudioAck(chunk.chunk_id, chunk.timestamp);

    // Play audio if it's time
    await this.syncManager.schedulePlayback(chunk.timestamp, () => {
      this.playAudioChunk(chunk);
    });
  }

  private handleStopStreaming(): void {
    this.isStreaming = false;
    this.onStreamingStateChangeCallback?.(false);
    this.audioBuffer.clear();
    this.syncManager.reset();
  }

  private handleSyncResponse(message: ServerMessage): void {
    const clientTimestamp = Date.now() / 1000;
    const latency = clientTimestamp - message.server_timestamp;
    
    if (this.currentDevice) {
      this.currentDevice.latency = latency;
    }
    
    this.onLatencyUpdateCallback?.(latency);
  }

  private sendAudioAck(chunkId: number, timestamp: number): void {
    if (!this.websocket || this.connectionState !== 'connected') {
      return;
    }

    const ack = {
      type: 'audio_chunk_ack',
      chunk_id: chunkId,
      timestamp: Date.now() / 1000,
    };

    this.websocket.send(JSON.stringify(ack));
  }

  private playAudioChunk(chunk: AudioChunk): void {
    // Convert chunk data to audio format and play
    // This is a simplified implementation - in reality you'd need
    // to convert the float32 data to the appropriate audio format
    // and use native audio APIs for low-latency playback
    
    try {
      // For now, we'll use a placeholder implementation
      // In a real app, you'd use react-native-sound or native audio APIs
      console.log(`Playing audio chunk ${chunk.chunk_id} at ${chunk.timestamp}`);
      
      // Apply volume
      const volumeAdjustedData = chunk.data.map(sample => sample * this.volume);
      
      // Here you would typically:
      // 1. Convert float32 data to PCM
      // 2. Write to audio buffer
      // 3. Schedule playback at precise timestamp
      
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  }

  public async startStreaming(audioFile?: string): Promise<void> {
    if (!this.websocket || this.connectionState !== 'connected') {
      throw new Error('Not connected to server');
    }

    const message = {
      type: 'start_streaming',
      audio_file: audioFile,
    };

    this.websocket.send(JSON.stringify(message));
  }

  public async stopStreaming(): Promise<void> {
    if (!this.websocket || this.connectionState !== 'connected') {
      return;
    }

    const message = {
      type: 'stop_streaming',
    };

    this.websocket.send(JSON.stringify(message));
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public requestSync(): void {
    if (!this.websocket || this.connectionState !== 'connected') {
      return;
    }

    const message = {
      type: 'sync_request',
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Event listener methods
  public onConnectionStateChange(callback: (state: ConnectionState) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  public onDeviceListUpdate(callback: (devices: Device[]) => void): void {
    this.onDeviceListUpdateCallback = callback;
  }

  public onStreamingStateChange(callback: (isStreaming: boolean) => void): void {
    this.onStreamingStateChangeCallback = callback;
  }

  public onLatencyUpdate(callback: (latency: number) => void): void {
    this.onLatencyUpdateCallback = callback;
  }

  public cleanup(): void {
    this.audioBuffer.clear();
    this.syncManager.reset();
    this.isStreaming = false;
  }
}
