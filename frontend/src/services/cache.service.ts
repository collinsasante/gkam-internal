// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Cache TTLs in milliseconds
  private readonly TTL = {
    TEAM_MEMBERS: 10 * 60 * 1000,     // 10 minutes - rarely changes
    ACCOUNTS: 5 * 60 * 1000,           // 5 minutes
    CONTACTS: 3 * 60 * 1000,           // 3 minutes
    CUSTOMER_CONTACTS: 3 * 60 * 1000,  // 3 minutes
    TASKS: 2 * 60 * 1000,              // 2 minutes - updates frequently
    ACTIVITIES: 2 * 60 * 1000,         // 2 minutes
    INTERACTIONS: 3 * 60 * 1000,       // 3 minutes
    DISCOVERY_CALLS: 5 * 60 * 1000,    // 5 minutes
    LEADS: 3 * 60 * 1000,              // 3 minutes
    DEALS: 2 * 60 * 1000,              // 2 minutes - changes frequently
    DESIGN_DRAFTS: 3 * 60 * 1000,      // 3 minutes
    DESIGN_FEEDBACK: 5 * 60 * 1000,    // 5 minutes
    LABEL_FORMS: 5 * 60 * 1000,        // 5 minutes
    DEFAULT: 5 * 60 * 1000,            // 5 minutes default
  };

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data as T;
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.getTTL(key);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`Cache SET: ${key} (TTL: ${Math.round(ttl / 1000)}s)`);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`Cache INVALIDATE: ${key}`);
  }

  invalidatePattern(pattern: string): void {
    // Invalidate all keys matching pattern
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern);

    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
        console.log(`Cache INVALIDATE: ${key}`);
      }
    });
  }

  clear(): void {
    this.cache.clear();
    console.log('Cache CLEARED');
  }

  private getTTL(key: string): number {
    // Extract table name from key
    const tableMatch = key.match(/^(\w+)/);
    if (!tableMatch) return this.TTL.DEFAULT;

    const tableName = tableMatch[1].toUpperCase().replace(/-/g, '_');
    return (this.TTL as any)[tableName] || this.TTL.DEFAULT;
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService();
