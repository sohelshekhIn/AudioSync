# AudioSync - Cross-Platform Audio Synchronization

A React Native + Python application for synchronized audio playback across multiple devices with low-latency streaming and dynamic connectivity.

## Features

- **Cross-Platform Support**: Works on iOS, Android, and desktop platforms
- **Low-Latency Streaming**: Optimized for real-time audio synchronization
- **Multi-Device Playback**: Connect multiple devices for synchronized audio
- **Dynamic Connectivity**: Automatic device discovery and connection management
- **Real-Time Synchronization**: Precise timing control for synchronized playback
- **Modern UI**: Beautiful, intuitive interface with device management
- **WebSocket Communication**: Efficient real-time communication between devices

## Architecture

### Backend (Python)

- **WebSocket Server**: Handles real-time communication with clients
- **Audio Streaming**: Processes and streams audio chunks with timing information
- **Device Management**: Tracks connected devices and their capabilities
- **Synchronization**: Manages timing and latency compensation

### Frontend (React Native)

- **Cross-Platform App**: Single codebase for iOS and Android
- **Audio Playback**: Native audio APIs for low-latency playback
- **Device Discovery**: Automatic detection of available audio devices
- **Real-Time UI**: Live updates of connection status and device information

## 🚀 Quick Start

### 🎯 One-Click Setup

**Linux/macOS:**

```bash
chmod +x start.sh
./start.sh
```

**Windows:**

```cmd
start.bat
```

The startup scripts will automatically:

- Set up Python virtual environment
- Install all dependencies
- Generate test audio files
- Start the server and React Native app
- Guide you through platform selection

### 📋 Prerequisites

- 📦 Node.js (v16 or higher)
- 🐍 Python 3.8+
- 📱 React Native development environment
- 🤖 Android Studio (for Android development)
- 🍎 Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AudioSync
   ```

2. **Install React Native dependencies**

   ```bash
   npm install
   ```

3. **Install Python dependencies**

   ```bash
   cd server
   pip install -r requirements.txt
   ```

4. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   ```

### Running the Application

1. **Start the Python server**

   ```bash
   cd server
   python main.py
   ```

2. **Start the React Native app**

   ```bash
   # For Android
   npm run android

   # For iOS
   npm run ios

   # Or start Metro bundler separately
   npm start
   ```

## Configuration

### Server Configuration

The Python server runs on `localhost:8080` by default. You can modify the server settings in `server/main.py`:

```python
server = AudioSyncServer(host='0.0.0.0', port=8080)
```

### Client Configuration

Update the server URL in the React Native app through the Settings screen or modify the default in `src/context/AudioSyncContext.tsx`:

```typescript
serverUrl: 'ws://192.168.1.100:8080', // Update with your server IP
```

## Usage

### Basic Setup

1. **Start the Server**: Run the Python server on your network
2. **Connect Devices**: Launch the app on multiple devices
3. **Configure Connection**: Enter the server IP address in Settings
4. **Connect**: Tap "Connect to Server" on each device
5. **Start Streaming**: Select audio and start synchronized playback

### Features Overview

#### Home Screen

- Connection status indicator
- Quick access to main features
- Real-time streaming status

#### Audio Player

- Audio file selection
- Volume control
- Playback controls
- Synchronization status

#### Device Management

- View connected devices
- Monitor latency and connection quality
- Enable/disable individual devices

#### Settings

- Server configuration
- Audio quality settings
- Device information
- Connection preferences

## Technical Details

### Audio Synchronization

The app uses a sophisticated synchronization system:

1. **Time Synchronization**: Server provides reference timestamps
2. **Latency Compensation**: Automatic adjustment for network delays
3. **Buffer Management**: Smart buffering to prevent audio dropouts
4. **Precise Scheduling**: Microsecond-accurate playback timing

### Network Protocol

Communication uses WebSocket with JSON messages:

```json
{
  "type": "audio_chunk",
  "chunk_id": 123,
  "timestamp": 1640995200.123,
  "data": [0.1, -0.2, 0.3, ...],
  "is_final": false
}
```

### Audio Processing

- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit
- **Channels**: Stereo (2 channels)
- **Chunk Size**: 4096 bytes (configurable)
- **Latency Target**: < 50ms

## Development

### Project Structure

```
AudioSync/
├── src/                    # React Native source code
│   ├── components/         # Reusable UI components
│   ├── screens/           # App screens
│   ├── services/          # Business logic and API services
│   ├── context/           # React context providers
│   └── types/             # TypeScript type definitions
├── server/                # Python backend
│   ├── main.py           # Main server application
│   ├── audio_streamer.py # Audio processing utilities
│   └── device_manager.py # Device management logic
├── android/              # Android-specific configuration
├── ios/                  # iOS-specific configuration
└── docs/                 # Documentation
```

### Building for Production

#### Android

```bash
cd android
./gradlew assembleRelease
```

#### iOS

```bash
cd ios
xcodebuild -workspace AudioSync.xcworkspace -scheme AudioSync archive
```

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Check server IP address
   - Verify firewall settings
   - Ensure devices are on same network

2. **Audio Latency**

   - Reduce buffer size in settings
   - Check network quality
   - Use wired connections when possible

3. **Synchronization Issues**
   - Restart server and clients
   - Check device clock synchronization
   - Monitor network latency

### Performance Optimization

- Use 5GHz WiFi for better performance
- Close unnecessary apps on mobile devices
- Use dedicated network for audio streaming
- Monitor CPU usage on server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Native community for excellent documentation
- Python WebSocket libraries for reliable communication
- Audio processing libraries for high-quality sound handling
