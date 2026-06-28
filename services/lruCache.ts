/**
 * Simple LRU cache using Map insertion-order semantics.
 * On set: if cache exceeds maxSize, delete the oldest entry (first key in insertion order).
 * On get: move the entry to the end (delete + re-set) to mark as most recently used.
 * Map iterators preserve insertion order, so keys().next().value returns the oldest.
 */
export function createLRUCache<K, V>(maxSize: number) {
  const map = new Map<K, V>();

  return {
    get(key: K): V | undefined {
      if (!map.has(key)) return undefined;
      // Move to end (most recently used)
      const value = map.get(key)!;
      map.delete(key);
      map.set(key, value);
      return value;
    },

    set(key: K, value: V): void {
      // If already exists, delete first so re-insert puts it at the end
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= maxSize) {
        // Evict oldest (first key in insertion order)
        const firstKey = map.keys().next().value;
        if (firstKey !== undefined) {
          map.delete(firstKey);
        }
      }
      map.set(key, value);
    },

    has(key: K): boolean {
      return map.has(key);
    },

    clear(): void {
      map.clear();
    },

    get size(): number {
      return map.size;
    },
  };
}
