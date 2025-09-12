#!/usr/bin/env python3
"""
Test script to generate sample audio files for AudioSync testing
"""

import numpy as np
import wave
import os
from audio_streamer import AudioStreamer

def generate_test_audio_files():
    """Generate various test audio files for testing AudioSync"""
    
    sample_rate = 44100
    duration = 10  # seconds
    
    # Create audio directory if it doesn't exist
    audio_dir = "audio_files"
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)
    
    # 1. Sine wave at 440 Hz (A4 note)
    print("Generating sine wave (440 Hz)...")
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    sine_wave = np.sin(2 * np.pi * 440 * t)
    stereo_sine = np.column_stack((sine_wave, sine_wave))
    save_wav(os.path.join(audio_dir, "sine_440.wav"), stereo_sine, sample_rate)
    
    # 2. Multi-tone test signal
    print("Generating multi-tone test signal...")
    frequencies = [220, 440, 880, 1760]  # A3, A4, A5, A6
    multi_tone = np.zeros_like(t)
    for freq in frequencies:
        multi_tone += 0.25 * np.sin(2 * np.pi * freq * t)
    stereo_multi = np.column_stack((multi_tone, multi_tone))
    save_wav(os.path.join(audio_dir, "multi_tone.wav"), stereo_multi, sample_rate)
    
    # 3. White noise
    print("Generating white noise...")
    white_noise = np.random.normal(0, 0.1, (int(sample_rate * duration), 2))
    save_wav(os.path.join(audio_dir, "white_noise.wav"), white_noise, sample_rate)
    
    # 4. Chirp (frequency sweep)
    print("Generating chirp signal...")
    f0, f1 = 100, 2000  # Start and end frequencies
    chirp = np.sin(2 * np.pi * (f0 * t + (f1 - f0) * t**2 / (2 * duration)))
    stereo_chirp = np.column_stack((chirp, chirp))
    save_wav(os.path.join(audio_dir, "chirp.wav"), stereo_chirp, sample_rate)
    
    # 5. Stereo test (different frequencies in each channel)
    print("Generating stereo test signal...")
    left_channel = np.sin(2 * np.pi * 440 * t)   # A4 in left
    right_channel = np.sin(2 * np.pi * 554.37 * t)  # C#5 in right
    stereo_test = np.column_stack((left_channel, right_channel))
    save_wav(os.path.join(audio_dir, "stereo_test.wav"), stereo_test, sample_rate)
    
    # 6. Rhythm pattern for sync testing
    print("Generating rhythm pattern...")
    rhythm = generate_rhythm_pattern(t, sample_rate)
    stereo_rhythm = np.column_stack((rhythm, rhythm))
    save_wav(os.path.join(audio_dir, "rhythm_test.wav"), stereo_rhythm, sample_rate)
    
    print(f"Test audio files generated in '{audio_dir}' directory")

def generate_rhythm_pattern(t, sample_rate):
    """Generate a rhythmic pattern for synchronization testing"""
    signal = np.zeros_like(t)
    beat_duration = 0.5  # 0.5 seconds per beat (120 BPM)
    
    for i in range(int(len(t) / (sample_rate * beat_duration))):
        start_idx = int(i * beat_duration * sample_rate)
        end_idx = int(start_idx + 0.1 * sample_rate)  # 100ms beep
        
        if i % 4 == 0:  # Accent every 4th beat
            frequency = 880  # Higher pitch for accent
            amplitude = 0.8
        else:
            frequency = 440  # Regular beat
            amplitude = 0.4
        
        if end_idx < len(signal):
            beat_t = t[start_idx:end_idx] - t[start_idx]
            beep = amplitude * np.sin(2 * np.pi * frequency * beat_t)
            # Apply envelope to avoid clicks
            envelope = np.exp(-beat_t * 20)
            signal[start_idx:end_idx] = beep * envelope
    
    return signal

def save_wav(filename, audio_data, sample_rate):
    """Save audio data as WAV file"""
    # Convert to 16-bit PCM
    audio_int16 = (audio_data * 32767).astype(np.int16)
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(2)  # Stereo
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())
    
    print(f"Saved: {filename}")

def test_audio_streamer():
    """Test the AudioStreamer class with generated files"""
    print("\nTesting AudioStreamer...")
    
    streamer = AudioStreamer()
    
    # Test loading different audio files
    test_files = [
        "audio_files/sine_440.wav",
        "audio_files/multi_tone.wav",
        "audio_files/white_noise.wav"
    ]
    
    for file_path in test_files:
        if os.path.exists(file_path):
            try:
                audio_data = streamer.load_audio(file_path)
                chunks = streamer.split_into_chunks(audio_data, 4096)
                print(f"✓ {file_path}: {len(audio_data)} samples, {len(chunks)} chunks")
            except Exception as e:
                print(f"✗ {file_path}: Error - {e}")
        else:
            print(f"✗ {file_path}: File not found")

if __name__ == "__main__":
    print("AudioSync Test Audio Generator")
    print("=" * 40)
    
    try:
        generate_test_audio_files()
        test_audio_streamer()
        print("\n✓ All test files generated successfully!")
        print("You can now use these files with the AudioSync server.")
        
    except Exception as e:
        print(f"\n✗ Error generating test files: {e}")
        import traceback
        traceback.print_exc()
