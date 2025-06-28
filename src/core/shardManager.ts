import * as path from 'path';
import * as fs from 'fs-extra';
import { GlobalMetadata, ContextDatabase, ShardMetadata } from '../types';

export class ShardManager {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  private async getMetadata(): Promise<GlobalMetadata> {
    const metadataPath = path.join(this.storagePath, 'metadata.json');
    return await fs.readJson(metadataPath);
  }

  private async saveMetadata(metadata: GlobalMetadata): Promise<void> {
    const metadataPath = path.join(this.storagePath, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  public async getCurrentShard(): Promise<string> {
    const metadata = await this.getMetadata();
    
    if (!metadata.currentShard) {
      // No shards exist yet, create the first one
      return await this.createNewShard();
    }

    const currentShardMeta = metadata.shards[metadata.currentShard];
    if (currentShardMeta.status === 'full') {
      // Current shard is full, create a new one
      return await this.createNewShard();
    }

    return metadata.currentShard;
  }

  public async createNewShard(): Promise<string> {
    const metadata = await this.getMetadata();
    const shardNumber = metadata.totalShards + 1;
    const shardId = `shard-${shardNumber.toString().padStart(3, '0')}`;
    const shardPath = path.join(this.storagePath, 'shards', `${shardId}.json`);

    // Create empty shard file
    const emptyShardData: ContextDatabase = {
      shardId: shardId,
      contexts: {}
    };
    await fs.writeJson(shardPath, emptyShardData, { spaces: 2 });

    // Update metadata
    metadata.totalShards++;
    metadata.currentShard = shardId;
    metadata.shards[shardId] = {
      entries: 0,
      sizeBytes: JSON.stringify(emptyShardData).length,
      status: 'active'
    };

    await this.saveMetadata(metadata);
    return shardId;
  }

  public async loadShard(shardId: string): Promise<ContextDatabase> {
    const shardPath = path.join(this.storagePath, 'shards', `${shardId}.json`);
    return await fs.readJson(shardPath);
  }

  public async saveShard(shardData: ContextDatabase): Promise<void> {
    const shardPath = path.join(this.storagePath, 'shards', `${shardData.shardId}.json`);
    await fs.writeJson(shardPath, shardData, { spaces: 2 });

    // Update metadata with new size and entry count
    const metadata = await this.getMetadata();
    const shardSize = JSON.stringify(shardData).length;
    const entryCount = Object.keys(shardData.contexts).length;
    
    metadata.shards[shardData.shardId] = {
      entries: entryCount,
      sizeBytes: shardSize,
      status: shardSize >= 5 * 1024 * 1024 ? 'full' : 'active' // 5MB limit
    };

    metadata.totalEntries = Object.values(metadata.shards).reduce((sum, shard) => sum + shard.entries, 0);
    await this.saveMetadata(metadata);
  }

  public async getAllShardIds(): Promise<string[]> {
    const metadata = await this.getMetadata();
    return Object.keys(metadata.shards);
  }

  public async checkShardCapacity(shardId: string, additionalContent: string): Promise<boolean> {
    const shardData = await this.loadShard(shardId);
    const currentSize = JSON.stringify(shardData).length;
    const additionalSize = JSON.stringify(additionalContent).length;
    
    return (currentSize + additionalSize) < 5 * 1024 * 1024; // 5MB limit
  }
}