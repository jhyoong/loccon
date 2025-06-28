import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Config } from '../types';

export class ConfigManager {
  private static isGlobalInstall(): boolean {
    // Check if we're in a global npm installation context
    const currentPath = process.cwd();
    const nodeModulesPath = path.join(os.homedir(), '.npm-global', 'lib', 'node_modules');
    return currentPath.includes(nodeModulesPath) || currentPath.includes('/usr/local/lib/node_modules');
  }

  public static getStoragePath(customPath?: string): string {
    if (customPath) {
      return path.resolve(customPath);
    }

    if (this.isGlobalInstall()) {
      return path.join(os.homedir(), '.loccon');
    } else {
      return path.join(process.cwd(), '.loccon');
    }
  }

  public static async initializeStorage(storagePath: string): Promise<void> {
    const shardsDir = path.join(storagePath, 'shards');
    
    // Create directories
    await fs.ensureDir(storagePath);
    await fs.ensureDir(shardsDir);

    // Initialize config.json if it doesn't exist
    const configPath = path.join(storagePath, 'config.json');
    if (!await fs.pathExists(configPath)) {
      const config: Config = {
        version: '1.0.0',
        storageType: 'sharded',
        maxShardSize: '5MB',
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      await fs.writeJson(configPath, config, { spaces: 2 });
    }

    // Initialize index.json if it doesn't exist
    const indexPath = path.join(storagePath, 'index.json');
    if (!await fs.pathExists(indexPath)) {
      const index = {
        tagToShard: {},
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(indexPath, index, { spaces: 2 });
    }

    // Initialize metadata.json if it doesn't exist
    const metadataPath = path.join(storagePath, 'metadata.json');
    if (!await fs.pathExists(metadataPath)) {
      const metadata = {
        totalEntries: 0,
        totalShards: 0,
        currentShard: '',
        shards: {}
      };
      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    }
  }

  public static async updateLastAccessed(storagePath: string): Promise<void> {
    const configPath = path.join(storagePath, 'config.json');
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      config.lastAccessed = new Date().toISOString();
      await fs.writeJson(configPath, config, { spaces: 2 });
    }
  }
}