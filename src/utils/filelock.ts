import * as path from 'path';
import * as fs from 'fs-extra';

export class FileLock {
  private lockPath: string;
  private lockTimeout: number;
  private acquired: boolean = false;

  constructor(storagePath: string, lockTimeout: number = 5000) {
    this.lockPath = path.join(storagePath, '.lock');
    this.lockTimeout = lockTimeout;
  }

  public async acquire(): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.lockTimeout) {
      try {
        // Try to create lock file exclusively
        await fs.writeFile(this.lockPath, process.pid.toString(), { flag: 'wx' });
        this.acquired = true;
        return;
      } catch (error) {
        // Lock file exists, check if process is still running
        if (await this.isStale()) {
          await this.forceRelease();
          continue;
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    throw new Error(`Failed to acquire lock within ${this.lockTimeout}ms`);
  }

  public async release(): Promise<void> {
    if (this.acquired) {
      try {
        await fs.unlink(this.lockPath);
        this.acquired = false;
      } catch (error) {
        // Lock file might have been cleaned up already
      }
    }
  }

  private async isStale(): Promise<boolean> {
    try {
      const lockContent = await fs.readFile(this.lockPath, 'utf8');
      const lockPid = parseInt(lockContent.trim());
      
      // Check if the process is still running
      try {
        process.kill(lockPid, 0); // Signal 0 doesn't kill, just checks existence
        return false; // Process is still running
      } catch (error) {
        return true; // Process doesn't exist, lock is stale
      }
    } catch (error) {
      return true; // Can't read lock file, consider it stale
    }
  }

  private async forceRelease(): Promise<void> {
    try {
      await fs.unlink(this.lockPath);
    } catch (error) {
      // Ignore errors when force releasing
    }
  }

  public static async cleanupStaleLocks(storagePath: string): Promise<void> {
    const lockPath = path.join(storagePath, '.lock');
    
    if (await fs.pathExists(lockPath)) {
      const lock = new FileLock(storagePath);
      if (await lock.isStale()) {
        await lock.forceRelease();
      }
    }
  }
}