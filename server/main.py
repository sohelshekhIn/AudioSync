#!/usr/bin/env python3
"""
AudioSync Server - Handles audio streaming and device synchronization
"""

import asyncio
import websockets
import json
import threading
import time
import socket
from typing import Dict, Set, List
import wave
import numpy as np
from audio_streamer import AudioStreamer
from device_manager import DeviceManager

class AudioSyncServer:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.device_manager = DeviceManager()
        self.audio_streamer = AudioStreamer()
        self.is_streaming = False
        self.current_audio_file = None
        self.sync_timestamp = 0
        
    async def register_client(self, websocket, path):
        """Register a new client device"""
        client_id = f"client_{len(self.clients)}"
        self.clients[client_id] = websocket
        
        # Send welcome message with client ID
        await websocket.send(json.dumps({
            'type': 'connection',
            'client_id': client_id,
            'message': 'Connected to AudioSync server'
        }))
        
        print(f"Client {client_id} connected from {websocket.remote_address}")
        
        # Notify all clients about new device
        await self.broadcast_device_list()
        
        try:
            async for message in websocket:
                await self.handle_message(client_id, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            # Clean up on disconnect
            if client_id in self.clients:
                del self.clients[client_id]
            print(f"Client {client_id} disconnected")
            await self.broadcast_device_list()
    
    async def handle_message(self, client_id: str, message: str):
        """Handle incoming messages from clients"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'device_info':
                await self.handle_device_info(client_id, data)
            elif message_type == 'start_streaming':
                await self.start_audio_streaming(data.get('audio_file'))
            elif message_type == 'stop_streaming':
                await self.stop_audio_streaming()
            elif message_type == 'sync_request':
                await self.handle_sync_request(client_id)
            elif message_type == 'audio_chunk_ack':
                await self.handle_audio_ack(client_id, data)
            else:
                print(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            print(f"Invalid JSON from client {client_id}: {message}")
    
    async def handle_device_info(self, client_id: str, data: dict):
        """Handle device information updates"""
        device_info = {
            'id': client_id,
            'name': data.get('device_name', 'Unknown Device'),
            'platform': data.get('platform', 'unknown'),
            'capabilities': data.get('capabilities', []),
            'latency': data.get('latency', 0)
        }
        
        self.device_manager.update_device(client_id, device_info)
        await self.broadcast_device_list()
    
    async def broadcast_device_list(self):
        """Broadcast current device list to all clients"""
        device_list = self.device_manager.get_device_list()
        message = json.dumps({
            'type': 'device_list',
            'devices': device_list
        })
        
        # Send to all connected clients
        if self.clients:
            await asyncio.gather(
                *[client.send(message) for client in self.clients.values()],
                return_exceptions=True
            )
    
    async def start_audio_streaming(self, audio_file: str = None):
        """Start streaming audio to all connected devices"""
        if self.is_streaming:
            return
        
        self.is_streaming = True
        self.current_audio_file = audio_file or "default_audio.wav"
        self.sync_timestamp = time.time() + 2  # Start in 2 seconds
        
        # Notify all clients to prepare for streaming
        prepare_message = json.dumps({
            'type': 'prepare_streaming',
            'audio_file': self.current_audio_file,
            'sync_timestamp': self.sync_timestamp,
            'sample_rate': 44100,
            'channels': 2
        })
        
        if self.clients:
            await asyncio.gather(
                *[client.send(prepare_message) for client in self.clients.values()],
                return_exceptions=True
            )
        
        # Start streaming audio chunks
        asyncio.create_task(self.stream_audio_chunks())
    
    async def stream_audio_chunks(self):
        """Stream audio chunks to all clients with synchronization"""
        try:
            audio_data = self.audio_streamer.load_audio(self.current_audio_file)
            chunk_size = 4096  # bytes per chunk
            chunks = self.audio_streamer.split_into_chunks(audio_data, chunk_size)
            
            chunk_duration = chunk_size / (44100 * 2 * 2)  # 44.1kHz, 2 channels, 16-bit
            
            # Wait for sync timestamp
            while time.time() < self.sync_timestamp:
                await asyncio.sleep(0.001)
            
            for i, chunk in enumerate(chunks):
                if not self.is_streaming:
                    break
                
                chunk_timestamp = self.sync_timestamp + (i * chunk_duration)
                
                message = json.dumps({
                    'type': 'audio_chunk',
                    'chunk_id': i,
                    'timestamp': chunk_timestamp,
                    'data': chunk.tolist(),  # Convert numpy array to list
                    'is_final': i == len(chunks) - 1
                })
                
                if self.clients:
                    await asyncio.gather(
                        *[client.send(message) for client in self.clients.values()],
                        return_exceptions=True
                    )
                
                # Maintain timing
                next_send_time = time.time() + chunk_duration
                sleep_time = max(0, next_send_time - time.time())
                await asyncio.sleep(sleep_time)
            
        except Exception as e:
            print(f"Error streaming audio: {e}")
        finally:
            self.is_streaming = False
    
    async def stop_audio_streaming(self):
        """Stop audio streaming"""
        self.is_streaming = False
        
        stop_message = json.dumps({
            'type': 'stop_streaming'
        })
        
        if self.clients:
            await asyncio.gather(
                *[client.send(stop_message) for client in self.clients.values()],
                return_exceptions=True
            )
    
    async def handle_sync_request(self, client_id: str):
        """Handle synchronization request from client"""
        current_time = time.time()
        
        sync_response = json.dumps({
            'type': 'sync_response',
            'server_timestamp': current_time,
            'client_id': client_id
        })
        
        if client_id in self.clients:
            await self.clients[client_id].send(sync_response)
    
    async def handle_audio_ack(self, client_id: str, data: dict):
        """Handle audio chunk acknowledgment"""
        chunk_id = data.get('chunk_id')
        received_timestamp = data.get('timestamp')
        
        # Update device latency information
        if chunk_id is not None:
            latency = time.time() - received_timestamp
            self.device_manager.update_device_latency(client_id, latency)
    
    def start_server(self):
        """Start the WebSocket server"""
        print(f"Starting AudioSync server on {self.host}:{self.port}")
        
        start_server = websockets.serve(
            self.register_client,
            self.host,
            self.port,
            ping_interval=20,
            ping_timeout=10
        )
        
        asyncio.get_event_loop().run_until_complete(start_server)
        print("AudioSync server started successfully!")
        asyncio.get_event_loop().run_forever()

if __name__ == "__main__":
    server = AudioSyncServer()
    try:
        server.start_server()
    except KeyboardInterrupt:
        print("\nShutting down AudioSync server...")
    except Exception as e:
        print(f"Server error: {e}")
