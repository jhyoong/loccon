import * as path from 'path';
import * as fs from 'fs-extra';
import { IndexMapping } from '../types';

export class IndexManager {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  private async getIndex(): Promise<IndexMapping> {
    const indexPath = path.join(this.storagePath, 'index.json');
    return await fs.readJson(indexPath);
  }

  private async saveIndex(index: IndexMapping): Promise<void> {
    const indexPath = path.join(this.storagePath, 'index.json');
    index.lastUpdated = new Date().toISOString();
    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  public async getShardForTag(tag: string): Promise<string | null> {
    const index = await this.getIndex();
    return index.tagToShard[tag] || null;
  }

  public async setTagShard(tag: string, shardId: string): Promise<void> {
    const index = await this.getIndex();
    index.tagToShard[tag] = shardId;
    await this.saveIndex(index);
  }

  public async removeTag(tag: string): Promise<void> {
    const index = await this.getIndex();
    delete index.tagToShard[tag];
    await this.saveIndex(index);
  }

  public async getAllTags(): Promise<string[]> {
    const index = await this.getIndex();
    return Object.keys(index.tagToShard);
  }

  public async tagExists(tag: string): Promise<boolean> {
    const index = await this.getIndex();
    return tag in index.tagToShard;
  }

  public async rebuildIndex(): Promise<void> {
    // Rebuild index by scanning all shards
    const shardsDir = path.join(this.storagePath, 'shards');
    const shardFiles = await fs.readdir(shardsDir);
    
    const newIndex: IndexMapping = {
      tagToShard: {},
      lastUpdated: new Date().toISOString()
    };

    for (const shardFile of shardFiles) {
      if (shardFile.endsWith('.json')) {
        const shardPath = path.join(shardsDir, shardFile);
        const shardData = await fs.readJson(shardPath);
        const shardId = path.basename(shardFile, '.json');
        
        // Add all tags from this shard to the index
        for (const tag of Object.keys(shardData.contexts)) {
          newIndex.tagToShard[tag] = shardId;
        }
      }
    }

    await this.saveIndex(newIndex);
  }
}