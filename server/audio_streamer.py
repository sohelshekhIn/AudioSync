"""
Audio streaming utilities for AudioSync server
"""

import wave
import numpy as np
import os
from typing import List, Optional
from pydub import AudioSegment
import io

class AudioStreamer:
    def __init__(self):
        self.supported_formats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
    
    def load_audio(self, file_path: str) -> np.ndarray:
        """Load audio file and return as numpy array"""
        if not os.path.exists(file_path):
            # Create a default sine wave for testing
            return self.generate_test_audio()
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.wav':
            return self._load_wav(file_path)
        elif file_ext in ['.mp3', '.m4a', '.flac', '.ogg']:
            return self._load_with_pydub(file_path)
        else:
            raise ValueError(f"Unsupported audio format: {file_ext}")
    
    def _load_wav(self, file_path: str) -> np.ndarray:
        """Load WAV file using wave module"""
        with wave.open(file_path, 'rb') as wav_file:
            frames = wav_file.readframes(wav_file.getnframes())
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            
            # Convert to numpy array
            if sample_width == 1:
                dtype = np.uint8
            elif sample_width == 2:
                dtype = np.int16
            elif sample_width == 4:
                dtype = np.int32
            else:
                raise ValueError(f"Unsupported sample width: {sample_width}")
            
            audio_data = np.frombuffer(frames, dtype=dtype)
            
            if channels == 2:
                audio_data = audio_data.reshape(-1, 2)
            
            return audio_data.astype(np.float32) / np.iinfo(dtype).max
    
    def _load_with_pydub(self, file_path: str) -> np.ndarray:
        """Load audio file using pydub for various formats"""
        audio = AudioSegment.from_file(file_path)
        
        # Convert to stereo 44.1kHz 16-bit
        audio = audio.set_channels(2)
        audio = audio.set_frame_rate(44100)
        audio = audio.set_sample_width(2)
        
        # Convert to numpy array
        raw_data = audio.raw_data
        audio_data = np.frombuffer(raw_data, dtype=np.int16)
        audio_data = audio_data.reshape(-1, 2)
        
        return audio_data.astype(np.float32) / 32767.0
    
    def generate_test_audio(self, duration: float = 10.0, frequency: float = 440.0) -> np.ndarray:
        """Generate test sine wave audio"""
        sample_rate = 44100
        samples = int(sample_rate * duration)
        
        t = np.linspace(0, duration, samples, False)
        sine_wave = np.sin(2 * np.pi * frequency * t)
        
        # Create stereo by duplicating mono signal
        stereo_audio = np.column_stack((sine_wave, sine_wave))
        
        return stereo_audio.astype(np.float32)
    
    def split_into_chunks(self, audio_data: np.ndarray, chunk_size: int) -> List[np.ndarray]:
        """Split audio data into chunks for streaming"""
        chunks = []
        
        # Ensure chunk_size accounts for stereo (2 channels)
        if len(audio_data.shape) == 2:
            samples_per_chunk = chunk_size // (audio_data.shape[1] * 4)  # 4 bytes per float32
        else:
            samples_per_chunk = chunk_size // 4
        
        for i in range(0, len(audio_data), samples_per_chunk):
            chunk = audio_data[i:i + samples_per_chunk]
            chunks.append(chunk)
        
        return chunks
    
    def audio_to_bytes(self, audio_data: np.ndarray) -> bytes:
        """Convert numpy audio array to bytes"""
        # Convert float32 to int16 for transmission
        audio_int16 = (audio_data * 32767).astype(np.int16)
        return audio_int16.tobytes()
    
    def bytes_to_audio(self, audio_bytes: bytes, channels: int = 2) -> np.ndarray:
        """Convert bytes back to numpy audio array"""
        audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
        
        if channels == 2:
            audio_int16 = audio_int16.reshape(-1, 2)
        
        return audio_int16.astype(np.float32) / 32767.0
    
    def apply_volume(self, audio_data: np.ndarray, volume: float) -> np.ndarray:
        """Apply volume adjustment to audio data"""
        return audio_data * volume
    
    def apply_fade(self, audio_data: np.ndarray, fade_in_duration: float = 0.0, 
                   fade_out_duration: float = 0.0, sample_rate: int = 44100) -> np.ndarray:
        """Apply fade in/out to audio data"""
        result = audio_data.copy()
        
        if fade_in_duration > 0:
            fade_in_samples = int(fade_in_duration * sample_rate)
            fade_in_samples = min(fade_in_samples, len(result))
            fade_curve = np.linspace(0, 1, fade_in_samples)
            
            if len(result.shape) == 2:  # Stereo
                result[:fade_in_samples] *= fade_curve[:, np.newaxis]
            else:  # Mono
                result[:fade_in_samples] *= fade_curve
        
        if fade_out_duration > 0:
            fade_out_samples = int(fade_out_duration * sample_rate)
            fade_out_samples = min(fade_out_samples, len(result))
            fade_curve = np.linspace(1, 0, fade_out_samples)
            
            if len(result.shape) == 2:  # Stereo
                result[-fade_out_samples:] *= fade_curve[:, np.newaxis]
            else:  # Mono
                result[-fade_out_samples:] *= fade_curve
        
        return result
