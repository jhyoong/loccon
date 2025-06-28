import { StorageManager } from './storage';
import { ContextEntry, SearchResult } from '../types';

export class ContextManager {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public static async create(customStoragePath?: string): Promise<ContextManager> {
    const storage = await StorageManager.create(customStoragePath);
    return new ContextManager(storage);
  }

  public async add(tag: string, content: string, categories: string[] = []): Promise<void> {
    return await this.storage.addContext(tag, content, categories);
  }

  public async read(tag: string): Promise<ContextEntry | null> {
    return await this.storage.readContext(tag);
  }

  public async update(tag: string, content: string, categories: string[] = []): Promise<void> {
    return await this.storage.updateContext(tag, content, categories);
  }

  public async remove(tag: string): Promise<boolean> {
    return await this.storage.removeContext(tag);
  }

  public async list(): Promise<string[]> {
    return await this.storage.listAllTags();
  }

  public async getAll(): Promise<Record<string, ContextEntry>> {
    return await this.storage.getAllContexts();
  }

  public async search(query: string, useFuzzy: boolean = false): Promise<SearchResult[]> {
    return await this.storage.searchContexts(query, useFuzzy);
  }

  public async exists(tag: string): Promise<boolean> {
    const context = await this.storage.readContext(tag);
    return context !== null;
  }

  public getStoragePath(): string {
    return this.storage.getStoragePath();
  }

  public async rebuildIndex(): Promise<void> {
    return await this.storage.rebuildIndex();
  }
}