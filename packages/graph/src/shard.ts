// Records are written in shards rather than one file per entity, so the record data adds a
// fixed number of files toward the host's file cap. The record page computes the same shard.

export const SHARD_COUNT = 64;

/** The shard an entity's record lives in: two hex digits, from an FNV-1a hash of its ID. */
export function shardOf(id: string): string {
  let hash = 0x81_1c_9d_c5;
  for (const char of id) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0;
  }
  return (hash % SHARD_COUNT).toString(16).padStart(2, '0');
}
