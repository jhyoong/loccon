import { ContextEntry, ContextMetadata, SearchResult } from '../types';
import { ShardManager } from './shardManager';
import { IndexManager } from './indexManager';
import { ConfigManager } from './config';
import { FileLock } from '../utils/filelock';
import { Validator } from '../utils/validation';

export class StorageManager {
  private storagePath: string;
  private shardManager: ShardManager;
  private indexManager: IndexManager;
  private lock: FileLock;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.shardManager = new ShardManager(storagePath);
    this.indexManager = new IndexManager(storagePath);
    this.lock = new FileLock(storagePath);
  }

  public static async create(customStoragePath?: string): Promise<StorageManager> {
    const storagePath = ConfigManager.getStoragePath(customStoragePath);
    await FileLock.cleanupStaleLocks(storagePath);
    await ConfigManager.initializeStorage(storagePath);
    return new StorageManager(storagePath);
  }

  public async addContext(tag: string, content: string, categories: string[] = []): Promise<void> {
    Validator.validateTag(tag);
    Validator.validateContent(content);
    Validator.validateCategories(categories);

    await this.lock.acquire();
    try {
      // Check if tag already exists
      if (await this.indexManager.tagExists(tag)) {
        throw new Error(`Tag '${tag}' already exists`);
      }

      // Get current shard or create new one
      let currentShardId = await this.shardManager.getCurrentShard();
      
      // Check if current shard has capacity
      const entry: ContextEntry = {
        content: Validator.sanitizeInput(content),
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          categories: categories.map(cat => Validator.sanitizeInput(cat))
        }
      };

      const entrySize = JSON.stringify({ [tag]: entry }).length;
      if (!(await this.shardManager.checkShardCapacity(currentShardId, JSON.stringify(entry)))) {
        currentShardId = await this.shardManager.createNewShard();
      }

      // Load shard, add entry, and save
      const shardData = await this.shardManager.loadShard(currentShardId);
      shardData.contexts[tag] = entry;
      await this.shardManager.saveShard(shardData);

      // Update index
      await this.indexManager.setTagShard(tag, currentShardId);

      // Update last accessed time
      await ConfigManager.updateLastAccessed(this.storagePath);
    } finally {
      await this.lock.release();
    }
  }

  public async readContext(tag: string): Promise<ContextEntry | null> {
    Validator.validateTag(tag);

    const shardId = await this.indexManager.getShardForTag(tag);
    if (!shardId) {
      return null;
    }

    const shardData = await this.shardManager.loadShard(shardId);
    return shardData.contexts[tag] || null;
  }

  public async updateContext(tag: string, content: string, categories: string[] = []): Promise<void> {
    Validator.validateTag(tag);
    Validator.validateContent(content);
    Validator.validateCategories(categories);

    await this.lock.acquire();
    try {
      const shardId = await this.indexManager.getShardForTag(tag);
      if (!shardId) {
        throw new Error(`Tag '${tag}' not found`);
      }

      const shardData = await this.shardManager.loadShard(shardId);
      const existingEntry = shardData.contexts[tag];
      
      if (!existingEntry) {
        throw new Error(`Tag '${tag}' not found in shard`);
      }

      // Update the entry
      shardData.contexts[tag] = {
        content: Validator.sanitizeInput(content),
        metadata: {
          created: existingEntry.metadata.created,
          modified: new Date().toISOString(),
          categories: categories.map(cat => Validator.sanitizeInput(cat))
        }
      };

      await this.shardManager.saveShard(shardData);
      await ConfigManager.updateLastAccessed(this.storagePath);
    } finally {
      await this.lock.release();
    }
  }

  public async removeContext(tag: string): Promise<boolean> {
    Validator.validateTag(tag);

    await this.lock.acquire();
    try {
      const shardId = await this.indexManager.getShardForTag(tag);
      if (!shardId) {
        return false;
      }

      const shardData = await this.shardManager.loadShard(shardId);
      if (!(tag in shardData.contexts)) {
        return false;
      }

      delete shardData.contexts[tag];
      await this.shardManager.saveShard(shardData);
      await this.indexManager.removeTag(tag);
      await ConfigManager.updateLastAccessed(this.storagePath);
      
      return true;
    } finally {
      await this.lock.release();
    }
  }

  public async listAllTags(): Promise<string[]> {
    return await this.indexManager.getAllTags();
  }

  public async getAllContexts(): Promise<Record<string, ContextEntry>> {
    const allTags = await this.indexManager.getAllTags();
    const contexts: Record<string, ContextEntry> = {};

    for (const tag of allTags) {
      const context = await this.readContext(tag);
      if (context) {
        contexts[tag] = context;
      }
    }

    return contexts;
  }

  public async searchContexts(query: string, useFuzzy: boolean = false): Promise<SearchResult[]> {
    const allShardIds = await this.shardManager.getAllShardIds();
    const allEntries: { tag: string; entry: ContextEntry }[] = [];

    // Collect all entries from all shards
    for (const shardId of allShardIds) {
      const shardData = await this.shardManager.loadShard(shardId);
      
      for (const [tag, entry] of Object.entries(shardData.contexts)) {
        allEntries.push({ tag, entry });
      }
    }

    if (useFuzzy) {
      // Use Fuse.js for fuzzy search
      const Fuse = require('fuse.js');
      const options = {
        includeScore: true,
        keys: [
          { name: 'tag', weight: 0.4 },
          { name: 'entry.content', weight: 0.4 },
          { name: 'entry.metadata.categories', weight: 0.2 }
        ],
        threshold: 0.6
      };

      const fuse = new Fuse(allEntries, options);
      const fuseResults = fuse.search(query);
      
      return fuseResults.map((result: any) => ({
        tag: result.item.tag,
        entry: result.item.entry,
        score: result.score
      }));
    } else {
      // Simple text search
      const results: SearchResult[] = [];
      const queryLower = query.toLowerCase();

      for (const { tag, entry } of allEntries) {
        const searchText = `${tag} ${entry.content} ${entry.metadata.categories.join(' ')}`.toLowerCase();
        if (searchText.includes(queryLower)) {
          results.push({ tag, entry });
        }
      }

      return results;
    }
  }

  public async rebuildIndex(): Promise<void> {
    await this.lock.acquire();
    try {
      await this.indexManager.rebuildIndex();
    } finally {
      await this.lock.release();
    }
  }

  public getStoragePath(): string {
    return this.storagePath;
  }
}