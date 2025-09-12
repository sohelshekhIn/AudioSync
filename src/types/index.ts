export interface Device {
  id: string;
  name: string;
  platform: string;
  capabilities: string[];
  latency: number;
  average_latency?: number;
  volume?: number;
  enabled?: boolean;
  last_seen?: number;
}

export interface AudioChunk {
  chunk_id: number;
  timestamp: number;
  data: number[];
  is_final: boolean;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ServerMessage {
  type: string;
  [key: string]: any;
}

export interface AudioConfig {
  sample_rate: number;
  channels: number;
  bit_depth: number;
}

export interface SyncInfo {
  server_timestamp: number;
  client_timestamp: number;
  latency: number;
}
