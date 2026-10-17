export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export class InMemoryStorageProvider implements StorageProvider {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class LocalStorageProvider implements StorageProvider {
  private isAvailable(): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private fallback: InMemoryStorageProvider | null = null;

  private get provider(): StorageProvider {
    if (this.isAvailable()) {
      return window.localStorage;
    }
    if (!this.fallback) {
      this.fallback = new InMemoryStorageProvider();
    }
    return this.fallback;
  }

  getItem(key: string): string | null {
    return this.provider.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.provider.setItem(key, value);
  }

  removeItem(key: string): void {
    this.provider.removeItem(key);
  }

  clear(): void {
    this.provider.clear();
  }
}

export class StorageService {
  private readonly provider: StorageProvider;
  private readonly prefix: string;

  constructor(provider: StorageProvider = new LocalStorageProvider(), prefix = "dnd_dice_roller_") {
    this.provider = provider;
    this.prefix = prefix;
  }

  private formatKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.provider.getItem(this.formatKey(key));
      if (raw === null) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Failed to parse storage item for key '${key}', using fallback.`, err);
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.provider.setItem(this.formatKey(key), serialized);
    } catch (err) {
      console.error(`Failed to serialize and save storage item for key '${key}'.`, err);
    }
  }

  remove(key: string): void {
    this.provider.removeItem(this.formatKey(key));
  }

  clear(): void {
    this.provider.clear();
  }
}
