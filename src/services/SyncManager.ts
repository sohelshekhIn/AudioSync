export class SyncManager {
  private syncTimestamp = 0;
  private localTimeOffset = 0;
  private scheduledCallbacks: Map<number, () => void> = new Map();
  private timeoutIds: Map<number, NodeJS.Timeout> = new Map();
  private isActive = false;

  public setSyncTimestamp(serverTimestamp: number): void {
    this.syncTimestamp = serverTimestamp;
    this.localTimeOffset = Date.now() / 1000 - serverTimestamp;
    this.isActive = true;
  }

  public getCurrentSyncTime(): number {
    if (!this.isActive) {
      return Date.now() / 1000;
    }
    return Date.now() / 1000 - this.localTimeOffset;
  }

  public getTimeUntilSync(targetTimestamp: number): number {
    const currentTime = this.getCurrentSyncTime();
    return targetTimestamp - currentTime;
  }

  public async schedulePlayback(
    targetTimestamp: number,
    callback: () => void,
  ): Promise<void> {
    const timeUntilPlayback = this.getTimeUntilSync(targetTimestamp);
    const callbackId = Date.now() + Math.random();

    // If the time has already passed, execute immediately
    if (timeUntilPlayback <= 0) {
      callback();
      return;
    }

    // Schedule for future execution
    this.scheduledCallbacks.set(callbackId, callback);

    const timeoutId = setTimeout(() => {
      const scheduledCallback = this.scheduledCallbacks.get(callbackId);
      if (scheduledCallback) {
        scheduledCallback();
        this.scheduledCallbacks.delete(callbackId);
        this.timeoutIds.delete(callbackId);
      }
    }, timeUntilPlayback * 1000);

    this.timeoutIds.set(callbackId, timeoutId);
  }

  public calculateLatency(
    serverTimestamp: number,
    clientTimestamp: number,
  ): number {
    return Math.abs(clientTimestamp - serverTimestamp);
  }

  public adjustForLatency(
    targetTimestamp: number,
    estimatedLatency: number,
  ): number {
    // Adjust playback time to account for network latency
    return targetTimestamp - estimatedLatency;
  }

  public reset(): void {
    // Clear all scheduled callbacks
    for (const timeoutId of this.timeoutIds.values()) {
      clearTimeout(timeoutId);
    }

    this.scheduledCallbacks.clear();
    this.timeoutIds.clear();
    this.syncTimestamp = 0;
    this.localTimeOffset = 0;
    this.isActive = false;
  }

  public isSync(): boolean {
    return this.isActive;
  }

  public getSyncInfo(): {
    syncTimestamp: number;
    localTimeOffset: number;
    currentSyncTime: number;
    scheduledCallbacks: number;
  } {
    return {
      syncTimestamp: this.syncTimestamp,
      localTimeOffset: this.localTimeOffset,
      currentSyncTime: this.getCurrentSyncTime(),
      scheduledCallbacks: this.scheduledCallbacks.size,
    };
  }

  public cancelScheduledCallback(timestamp: number): boolean {
    for (const [id, callback] of this.scheduledCallbacks.entries()) {
      // This is a simplified approach - in a real implementation,
      // you'd need to track timestamps with callback IDs
      const timeoutId = this.timeoutIds.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.scheduledCallbacks.delete(id);
        this.timeoutIds.delete(id);
        return true;
      }
    }
    return false;
  }

  public getScheduledCallbackCount(): number {
    return this.scheduledCallbacks.size;
  }

  public clearOldCallbacks(olderThanSeconds: number): number {
    const cutoffTime = Date.now() / 1000 - olderThanSeconds;
    let clearedCount = 0;

    // This is simplified - in a real implementation, you'd track timestamps
    for (const [id, timeoutId] of this.timeoutIds.entries()) {
      // Clear very old timeouts (this is a safety measure)
      if (id < (Date.now() - olderThanSeconds * 1000)) {
        clearTimeout(timeoutId);
        this.scheduledCallbacks.delete(id);
        this.timeoutIds.delete(id);
        clearedCount++;
      }
    }

    return clearedCount;
  }
}
