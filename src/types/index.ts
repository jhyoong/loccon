export interface ContextEntry {
  content: string;
  metadata: ContextMetadata;
}

export interface ContextMetadata {
  created: string;        // ISO timestamp
  modified: string;       // ISO timestamp
  categories: string[];   // User-defined tags
}

export interface ContextDatabase {
  shardId: string;
  contexts: Record<string, ContextEntry>;
}

export interface IndexMapping {
  tagToShard: Record<string, string>;
  lastUpdated: string;
}

export interface ShardMetadata {
  entries: number;
  sizeBytes: number;
  status: 'active' | 'full';
}

export interface GlobalMetadata {
  totalEntries: number;
  totalShards: number;
  currentShard: string;
  shards: Record<string, ShardMetadata>;
}

export interface Config {
  version: string;
  storageType: 'sharded';
  maxShardSize: string;
  created: string;
  lastAccessed: string;
}

export interface SearchResult {
  tag: string;
  entry: ContextEntry;
  score?: number;
}

export interface CLIOptions {
  add?: string;
  msg?: string;
  read?: string;
  list?: boolean;
  search?: string;
  remove?: string;
  storagePath?: string;
}