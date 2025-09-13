import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from "react";
import { AudioSyncService } from "../services/AudioSyncService";
import { Device, ConnectionState } from "../types";

interface AudioSyncState {
  connectionState: ConnectionState;
  devices: Device[];
  currentDevice: Device | null;
  isStreaming: boolean;
  currentAudio: string | null;
  volume: number;
  latency: number;
  serverUrl: string;
}

type AudioSyncAction =
  | { type: "SET_CONNECTION_STATE"; payload: ConnectionState }
  | { type: "SET_DEVICES"; payload: Device[] }
  | { type: "SET_CURRENT_DEVICE"; payload: Device | null }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SET_CURRENT_AUDIO"; payload: string | null }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_LATENCY"; payload: number }
  | { type: "SET_SERVER_URL"; payload: string };

const initialState: AudioSyncState = {
  connectionState: "disconnected",
  devices: [],
  currentDevice: null,
  isStreaming: false,
  currentAudio: null,
  volume: 1.0,
  latency: 0,
  serverUrl: "ws://192.168.1.100:8080", // Default server URL
};

const audioSyncReducer = (
  state: AudioSyncState,
  action: AudioSyncAction
): AudioSyncState => {
  switch (action.type) {
    case "SET_CONNECTION_STATE":
      return { ...state, connectionState: action.payload };
    case "SET_DEVICES":
      return { ...state, devices: action.payload };
    case "SET_CURRENT_DEVICE":
      return { ...state, currentDevice: action.payload };
    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };
    case "SET_CURRENT_AUDIO":
      return { ...state, currentAudio: action.payload };
    case "SET_VOLUME":
      return { ...state, volume: action.payload };
    case "SET_LATENCY":
      return { ...state, latency: action.payload };
    case "SET_SERVER_URL":
      return { ...state, serverUrl: action.payload };
    default:
      return state;
  }
};

interface AudioSyncContextType {
  state: AudioSyncState;
  connect: (serverUrl?: string) => Promise<void>;
  disconnect: () => void;
  startStreaming: (audioFile?: string) => Promise<void>;
  stopStreaming: () => Promise<void>;
  setVolume: (volume: number) => void;
  setServerUrl: (url: string) => void;
}

const AudioSyncContext = createContext<AudioSyncContextType | undefined>(
  undefined
);

export const AudioSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(audioSyncReducer, initialState);
  const audioSyncService = useMemo(() => new AudioSyncService(), []);

  useEffect(() => {
    // Set up event listeners
    audioSyncService.onConnectionStateChange((connectionState) => {
      dispatch({ type: "SET_CONNECTION_STATE", payload: connectionState });
    });

    audioSyncService.onDeviceListUpdate((devices) => {
      dispatch({ type: "SET_DEVICES", payload: devices });
    });

    audioSyncService.onStreamingStateChange((isStreaming) => {
      dispatch({ type: "SET_STREAMING", payload: isStreaming });
    });

    audioSyncService.onLatencyUpdate((latency) => {
      dispatch({ type: "SET_LATENCY", payload: latency });
    });

    return () => {
      audioSyncService.cleanup();
    };
  }, [audioSyncService]);

  const connect = async (serverUrl?: string) => {
    const url = serverUrl || state.serverUrl;
    dispatch({ type: "SET_SERVER_URL", payload: url });
    await audioSyncService.connect(url);
  };

  const disconnect = () => {
    audioSyncService.disconnect();
  };

  const startStreaming = async (audioFile?: string) => {
    await audioSyncService.startStreaming(audioFile);
    dispatch({ type: "SET_CURRENT_AUDIO", payload: audioFile || null });
  };

  const stopStreaming = async () => {
    await audioSyncService.stopStreaming();
    dispatch({ type: "SET_CURRENT_AUDIO", payload: null });
  };

  const setVolume = (volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: volume });
    audioSyncService.setVolume(volume);
  };

  const setServerUrl = (url: string) => {
    dispatch({ type: "SET_SERVER_URL", payload: url });
  };

  return (
    <AudioSyncContext.Provider
      value={{
        state,
        connect,
        disconnect,
        startStreaming,
        stopStreaming,
        setVolume,
        setServerUrl,
      }}
    >
      {children}
    </AudioSyncContext.Provider>
  );
};

export const useAudioSync = (): AudioSyncContextType => {
  const context = useContext(AudioSyncContext);
  if (!context) {
    throw new Error("useAudioSync must be used within AudioSyncProvider");
  }
  return context;
};
