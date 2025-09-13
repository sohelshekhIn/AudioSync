import {AudioChunk, AudioConfig} from '../types';

export class AudioBuffer {
  private buffer: Map<number, AudioChunk> = new Map();
  private config: AudioConfig | null = null;
  private maxBufferSize = 100; // Maximum chunks to buffer
  private playbackPosition = 0;

  public initialize(config: AudioConfig): void {
    this.config = config;
    this.clear();
  }

  public addChunk(chunk: AudioChunk): void {
    // Add chunk to buffer
    this.buffer.set(chunk.chunk_id, chunk);

    // Remove old chunks if buffer is too large
    if (this.buffer.size > this.maxBufferSize) {
      this.cleanup();
    }
  }

  public getChunk(chunkId: number): AudioChunk | undefined {
    return this.buffer.get(chunkId);
  }

  public getNextChunk(): AudioChunk | undefined {
    const chunk = this.buffer.get(this.playbackPosition);
    if (chunk) {
      this.playbackPosition++;
      return chunk;
    }
    return undefined;
  }

  public hasChunk(chunkId: number): boolean {
    return this.buffer.has(chunkId);
  }

  public getBufferSize(): number {
    return this.buffer.size;
  }

  public getBufferedDuration(): number {
    if (!this.config || this.buffer.size === 0) {
      return 0;
    }

    // Estimate duration based on chunk size and sample rate
    const avgChunkSize = 4096; // bytes
    const bytesPerSample = (this.config.bit_depth / 8) * this.config.channels;
    const samplesPerChunk = avgChunkSize / bytesPerSample;
    const durationPerChunk = samplesPerChunk / this.config.sample_rate;

    return this.buffer.size * durationPerChunk;
  }

  public clear(): void {
    this.buffer.clear();
    this.playbackPosition = 0;
  }

  private cleanup(): void {
    // Remove chunks that are too old
    const currentTime = Date.now() / 1000;
    const maxAge = 10; // seconds

    for (const [chunkId, chunk] of this.buffer.entries()) {
      if (currentTime - chunk.timestamp > maxAge) {
        this.buffer.delete(chunkId);
      }
    }
  }

  public getBufferHealth(): {
    size: number;
    duration: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    if (this.buffer.size === 0) {
      return {
        size: 0,
        duration: 0,
        oldestTimestamp: 0,
        newestTimestamp: 0,
      };
    }

    const chunks = Array.from(this.buffer.values());
    const timestamps = chunks.map(chunk => chunk.timestamp);

    return {
      size: this.buffer.size,
      duration: this.getBufferedDuration(),
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    };
  }

  public getChunksInRange(startTime: number, endTime: number): AudioChunk[] {
    const chunks: AudioChunk[] = [];

    for (const chunk of this.buffer.values()) {
      if (chunk.timestamp >= startTime && chunk.timestamp <= endTime) {
        chunks.push(chunk);
      }
    }

    return chunks.sort((a, b) => a.chunk_id - b.chunk_id);
  }

  public removeChunksOlderThan(timestamp: number): number {
    let removedCount = 0;

    for (const [chunkId, chunk] of this.buffer.entries()) {
      if (chunk.timestamp < timestamp) {
        this.buffer.delete(chunkId);
        removedCount++;
      }
    }

    return removedCount;
  }

  public setMaxBufferSize(size: number): void {
    this.maxBufferSize = Math.max(10, size); // Minimum of 10 chunks

    if (this.buffer.size > this.maxBufferSize) {
      this.cleanup();
    }
  }

  public getConfig(): AudioConfig | null {
    return this.config;
  }
}
